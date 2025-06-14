import { defaultPrompt } from "@/prompt/default/default-prompt"
import { mrBeastPrompt } from "@/prompt/persona/mrbeast-prompt"
import { taylorSwiftPrompt } from "@/prompt/persona/taylor-swift-prompt"
import { sundarPichaiPrompt } from "@/prompt/persona/sundar-pichai-prompt"
import { createGoogleGenerativeAI } from "@ai-sdk/google"
import { streamText, generateText, tool, experimental_generateImage as generateImage } from "ai"
import { z } from "zod"
import { createServerSupabaseClient, requireAuth, uploadImageToStorage } from '@/lib/supabase-server';

export const maxDuration = 30

export async function POST(req: Request) {
    try {
        const { messages, persona, conversationId } = await req.json()
        const apiKey = req.headers.get("x-api-key")

        // Require authentication for API access
        const user = await requireAuth();

        // Fetch user preferences for AI personalization
        const supabase = await createServerSupabaseClient();
        const { data: userPreferences } = await supabase
            .from('user_preferences')
            .select('*')
            .eq('user_id', user.id)
            .single();

        // Check if conversationId is provided and validate format
        let validConversationId = null;
        if (conversationId) {
            // Validate UUID format - allow null/undefined to proceed without conversation saving
            const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
            if (uuidRegex.test(conversationId)) {
                validConversationId = conversationId;
            } else {
                // Don't throw error, just proceed without saving to database
                validConversationId = null;
            }
        }

        // Get the latest user message to save to database (only if we have valid conversation ID)
        const latestUserMessage = messages[messages.length - 1];
        if (latestUserMessage && latestUserMessage.role === 'user' && validConversationId) {
          await saveMessageToDatabase(validConversationId, 'user', latestUserMessage.content);
        }

        const google = createGoogleGenerativeAI({
            apiKey: apiKey || process.env.GOOGLE_GENERATIVE_AI_API_KEY,
        })

        const model = google("gemini-2.0-flash")

        // Select system prompt based on persona
        let systemPrompt = defaultPrompt()

        // Add user preferences to system prompt for personalization
        if (userPreferences) {
            const personalizationContext = `

USER PERSONALIZATION CONTEXT:
${userPreferences.display_name ? `- User's preferred name: ${userPreferences.display_name}` : ''}
${userPreferences.occupation ? `- User's occupation: ${userPreferences.occupation}` : ''}
${userPreferences.traits && userPreferences.traits.length > 0 ? `- User's traits/interests: ${userPreferences.traits.join(', ')}` : ''}
${userPreferences.additional_info ? `- Additional user context: ${userPreferences.additional_info}` : ''}

Please use this information to personalize your responses appropriately. Address the user by their preferred name when appropriate, and tailor your responses to their occupation, interests, and context when relevant.`;

            systemPrompt += personalizationContext;
        }

        if (persona) {
            switch (persona.toLowerCase()) {
                case 'mrbeast':
                    systemPrompt = mrBeastPrompt()
                    break
                case 'taylor swift':
                    systemPrompt = taylorSwiftPrompt()
                    break
                case 'sundar pichai':
                    systemPrompt = sundarPichaiPrompt()
                    break
                default:
                    systemPrompt = defaultPrompt()
            }
            
            // Add user preferences to persona prompts as well
            if (userPreferences) {
                const personalizationContext = `

USER PERSONALIZATION CONTEXT:
${userPreferences.display_name ? `- User's preferred name: ${userPreferences.display_name}` : ''}
${userPreferences.occupation ? `- User's occupation: ${userPreferences.occupation}` : ''}
${userPreferences.traits && userPreferences.traits.length > 0 ? `- User's traits/interests: ${userPreferences.traits.join(', ')}` : ''}
${userPreferences.additional_info ? `- Additional user context: ${userPreferences.additional_info}` : ''}

Please use this information to personalize your responses appropriately while maintaining your persona. Address the user by their preferred name when appropriate, and tailor your responses to their occupation, interests, and context when relevant.`;

                systemPrompt += personalizationContext;
            }
        }

        const result = streamText({
            model,
            messages,
            tools: {
                generateProductCard: tool({
                    description: "Generate product card(s) with details about product(s). Can generate multiple products if count > 1.",
                    parameters: z.object({
                        count: z.number().min(1).max(10).optional().describe("Number of products to generate").default(1),
                        id: z.string().describe("Product ID (will be auto-generated for multiple products)"),
                        title: z.string().describe("Product title"),
                        price: z.number().describe("Product price"),
                        originalPrice: z.number().optional().describe("Original price before discount"),
                        currency: z.string().optional().describe("Currency symbol").default("$"),
                        rating: z.number().min(0).max(5).describe("Product rating out of 5"),
                        reviewCount: z.number().optional().describe("Number of reviews"),
                        imageUrl: z.string().describe("Product image URL"),
                        imageAlt: z.string().optional().describe("Alt text for product image"),
                        platform: z.enum(["amazon", "flipkart", "ebay", "other"]).describe("Shopping platform"),
                        discount: z.number().optional().describe("Discount percentage"),
                    }),
                    execute: async (params) => {
                        if (params.count === 1) {
                            return params
                        }

                        // Generate array of products
                        const products: typeof params[] = []
                        for (let i = 0; i < params.count; i++) {
                            products.push({
                                ...params,
                                id: `${params.id}-${i + 1}`,
                                title: `${params.title} ${i + 1}`,
                            })
                        }

                        return products
                    },
                }),
                generateWeatherCard: tool({
                    description: "Generate a weather card with current weather information using AccuWeather API",
                    parameters: z.object({
                        location: z.string().describe("Location name (city, state, country)"),
                    }),
                    execute: async (params) => {
                        try {
                            const apiKey = process.env.ACCUWEATHER_API_KEY
                            if (!apiKey) {
                                throw new Error("AccuWeather API key not configured")
                            }

                            const locationSearchUrl = `https://dataservice.accuweather.com/locations/v1/cities/search?apikey=${apiKey}&q=${encodeURIComponent(params.location)}`

                            const locationResponse = await fetch(locationSearchUrl)
                            const locationData = await locationResponse.json()

                            if (!locationData || locationData.length === 0) {
                                throw new Error(`Location "${params.location}" not found`)
                            }

                            const locationKey = locationData[0].Key
                            const locationName = `${locationData[0].LocalizedName}, ${locationData[0].Country?.LocalizedName || locationData[0].AdministrativeArea?.LocalizedName}`

                            // Get current weather conditions
                            const weatherUrl = `https://dataservice.accuweather.com/currentconditions/v1/${locationKey}?apikey=${apiKey}&details=true`

                            const weatherResponse = await fetch(weatherUrl)
                            const weatherData = await weatherResponse.json()

                            if (!weatherData || weatherData.length === 0) {
                                throw new Error("Weather data not available for this location")
                            }

                            const currentWeather = weatherData[0]

                            // Extract weather information
                            const temperature = Math.round(currentWeather.Temperature?.Metric?.Value || 0)
                            const condition = currentWeather.WeatherText || "Unknown"
                            const humidity = currentWeather.RelativeHumidity || 0
                            const windSpeed = Math.round(currentWeather.Wind?.Speed?.Metric?.Value || 0)
                            const description = currentWeather.WeatherText || "No description available"

                            return {
                                location: locationName,
                                temperature: temperature,
                                condition: condition,
                                humidity: humidity,
                                windSpeed: windSpeed,
                                description: description,
                                feelsLike: Math.round(currentWeather.RealFeelTemperature?.Metric?.Value || temperature),
                                uvIndex: currentWeather.UVIndex || null,
                                visibility: currentWeather.Visibility?.Metric?.Value || null,
                                pressure: currentWeather.Pressure?.Metric?.Value || null,
                                isDayTime: currentWeather.IsDayTime,
                                observationTime: currentWeather.LocalObservationDateTime,
                            }
                        } catch (error) {
                            // Return fallback data with error indication
                            return {
                                location: params.location,
                                temperature: 0,
                                condition: "Unknown",
                                humidity: 0,
                                windSpeed: 0,
                                description: "Unable to fetch weather data",
                                error: error instanceof Error ? error.message : "Failed to fetch weather data",
                                feelsLike: 0,
                                uvIndex: null,
                                visibility: null,
                                pressure: null,
                                isDayTime: true,
                                observationTime: new Date().toISOString(),
                            }
                        }
                    },
                }),
                generateStockCard: tool({
                    description: "Generate a stock information card using real data from Alpha Vantage API",
                    parameters: z.object({
                        ticker: z.string().describe("Stock ticker symbol (e.g., AAPL, GOOGL, MSFT, TATAMOTORS.BSE, TATASTEEL.NSE)"),
                    }),
                    execute: async (params) => {
                        try {
                            const apiKey = process.env.ALPHA_VANTAGE_API_KEY
                            if (!apiKey) {
                                throw new Error("Alpha Vantage API key not configured")
                            }

                            // Handle different ticker formats for Indian stocks
                            let searchTicker = params.ticker.toUpperCase()

                            // For Indian stocks, try different formats
                            const indianStockPatterns = [
                                searchTicker,
                                `${searchTicker}.BSE`,
                                `${searchTicker}.NSE`,
                                searchTicker.replace('.BSE', '').replace('.NSE', '')
                            ]

                            let quoteData = null
                            let overviewData = null
                            let finalTicker = searchTicker

                            // Try ticker variants and fetch quote data
                            for (const tickerVariant of indianStockPatterns) {
                                try {
                                    // Fetch quote data
                                    const quoteUrl = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${tickerVariant}&apikey=${apiKey}`
                                    const quoteResponse = await fetch(quoteUrl)
                                    const tempQuoteData = await quoteResponse.json()

                                    // Check if we got valid data
                                    if (tempQuoteData["Global Quote"] && tempQuoteData["Global Quote"]["05. price"]) {
                                        quoteData = tempQuoteData
                                        finalTicker = tickerVariant
                                        break
                                    }
                                } catch (error) {
                                    continue
                                }
                            }

                            // If no quote data found, try alternative approach
                            if (!quoteData || !quoteData["Global Quote"]) {
                                // Try search function to find the correct symbol
                                const searchUrl = `https://www.alphavantage.co/query?function=SYMBOL_SEARCH&keywords=${params.ticker}&apikey=${apiKey}`
                                const searchResponse = await fetch(searchUrl)
                                const searchData = await searchResponse.json()

                                if (searchData["bestMatches"] && searchData["bestMatches"].length > 0) {
                                    const bestMatch = searchData["bestMatches"][0]
                                    finalTicker = bestMatch["1. symbol"]

                                    // Try with the found symbol
                                    const quoteUrl = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${finalTicker}&apikey=${apiKey}`
                                    const quoteResponse = await fetch(quoteUrl)
                                    quoteData = await quoteResponse.json()
                                }
                            }

                            // Check for API errors
                            if (!quoteData || quoteData.Error || quoteData.Note || quoteData["Error Message"]) {
                                throw new Error(quoteData?.Error || quoteData?.Note || quoteData?.["Error Message"] || "No data found for ticker")
                            }

                            const quote = quoteData["Global Quote"]
                            if (!quote || !quote["05. price"]) {
                                throw new Error("No valid quote data found for ticker: " + params.ticker)
                            }

                            // Fetch company overview for additional data
                            try {
                                const overviewUrl = `https://www.alphavantage.co/query?function=OVERVIEW&symbol=${finalTicker}&apikey=${apiKey}`
                                const overviewResponse = await fetch(overviewUrl)
                                overviewData = await overviewResponse.json()
                            } catch (error) {
                                overviewData = {}
                            }

                            // Safely parse numeric values with null checks
                            const price = quote["05. price"] ? parseFloat(quote["05. price"]) : 0
                            const change = quote["09. change"] ? parseFloat(quote["09. change"]) : 0
                            const changePercentStr = quote["10. change percent"]
                            const changePercent = changePercentStr ? parseFloat(changePercentStr.replace("%", "")) : 0
                            const volume = quote["06. volume"] ? parseInt(quote["06. volume"]) : 0
                            const dayLow = quote["04. low"] ? parseFloat(quote["04. low"]) : 0
                            const dayHigh = quote["03. high"] ? parseFloat(quote["03. high"]) : 0
                            const prevClose = quote["08. previous close"] ? parseFloat(quote["08. previous close"]) : 0

                            // Validate that we have essential data
                            if (!price || isNaN(price)) {
                                throw new Error("Invalid price data received from API")
                            }

                            // Determine exchange based on ticker
                            let exchange = "Unknown"
                            if (finalTicker.includes(".BSE")) {
                                exchange = "BSE"
                            } else if (finalTicker.includes(".NSE")) {
                                exchange = "NSE"
                            } else if (overviewData && overviewData.Exchange) {
                                exchange = overviewData.Exchange
                            } else {
                                // Default exchanges for common patterns
                                exchange = finalTicker.length <= 4 ? "NASDAQ/NYSE" : "Unknown"
                            }

                            // Determine currency based on exchange
                            let currency = "USD"
                            if (exchange === "BSE" || exchange === "NSE") {
                                currency = "INR"
                            }

                            // Generate mock historical data for chart (in production, you'd fetch real data)
                            const generateChartData = (currentPrice: number, changePercent: number) => {
                                const data = []
                                let basePrice = currentPrice / (1 + changePercent / 100)

                                for (let i = 0; i < 30; i++) {
                                    const volatility = (Math.random() - 0.5) * 0.05
                                    const trend = (changePercent / 100) * (i / 30)
                                    basePrice = basePrice * (1 + trend + volatility)
                                    data.push(Number(basePrice.toFixed(2)))
                                }

                                data[data.length - 1] = currentPrice
                                return data
                            }

                            // Calculate additional metrics
                            const weekHigh52 = overviewData?.["52WeekHigh"] ? parseFloat(overviewData["52WeekHigh"]) : null
                            const weekLow52 = overviewData?.["52WeekLow"] ? parseFloat(overviewData["52WeekLow"]) : null
                            const beta = overviewData?.Beta ? parseFloat(overviewData.Beta) : null
                            const eps = overviewData?.EPS ? parseFloat(overviewData.EPS) : null

                            // Return data with correct property names for StockCard
                            return {
                                name: overviewData?.Name || `${params.ticker.toUpperCase()} Stock`,
                                ticker: quote["01. symbol"] || finalTicker,
                                price: price,
                                change: change,
                                changePercent: changePercent,
                                exchange: exchange,
                                currency: currency,
                                volume: volume || null,
                                marketCap: overviewData?.MarketCapitalization || null,
                                dayRange: (dayLow && dayHigh) ? {
                                    low: dayLow,
                                    high: dayHigh,
                                } : null,
                                peRatio: overviewData?.PERatio ? parseFloat(overviewData.PERatio) : null,
                                dividendYield: overviewData?.DividendYield ? parseFloat(overviewData.DividendYield) * 100 : null,
                                sector: overviewData?.Sector || null,
                                industry: overviewData?.Industry || null,
                                description: overviewData?.Description || null,
                                chartData: generateChartData(price, changePercent),
                                previousClose: prevClose || null,
                                weekHigh52: weekHigh52,
                                weekLow52: weekLow52,
                                beta: beta,
                                eps: eps,
                                bookValue: overviewData?.BookValue ? parseFloat(overviewData.BookValue) : null,
                                priceToBook: overviewData?.PriceToBookRatio ? parseFloat(overviewData.PriceToBookRatio) : null,
                                lastUpdated: new Date().toISOString(),
                            }
                        } catch (error) {
                            // Return fallback data with error indication
                            return {
                                name: `${params.ticker.toUpperCase()} Stock`,
                                ticker: params.ticker.toUpperCase(),
                                price: 0,
                                change: 0,
                                changePercent: 0,
                                exchange: "Unknown",
                                currency: "USD",
                                error: error instanceof Error ? error.message : "Failed to fetch stock data",
                                volume: null,
                                marketCap: null,
                                dayRange: null,
                                peRatio: null,
                                dividendYield: null,
                                sector: null,
                                industry: null,
                                description: null,
                                chartData: null,
                                previousClose: null,
                                weekHigh52: null,
                                weekLow52: null,
                                beta: null,
                                eps: null,
                                bookValue: null,
                                priceToBook: null,
                                lastUpdated: new Date().toISOString(),
                            }
                        }
                    },
                }),
                generateImage: tool({
                    description: "Generate an image based on a text prompt using Gemini's image generation model",
                    parameters: z.object({
                        prompt: z.string().describe("Detailed description of the image to generate"),
                        aspectRatio: z
                            .enum(["1:1", "16:9", "9:16"])
                            .optional()
                            .describe("Aspect ratio of the image")
                            .default("1:1"),
                    }),
                    execute: async (params) => {
                        try {
                            const imageModel = google("gemini-2.0-flash-preview-image-generation")

                            const result = await generateText({
                                model: imageModel,
                                prompt: `Generate an image: ${params.prompt}`,
                                providerOptions: {
                                    google: { responseModalities: ["TEXT", "IMAGE"] },
                                },
                            })

                            // Check if files were generated
                            if (result.files && result.files.length > 0) {
                                // Find the first image file
                                const imageFile = result.files.find((file) => file.mimeType.startsWith("image/"))

                                if (imageFile) {
                                    // Use the base64 property directly from the AI SDK
                                    if (imageFile.base64) {
                                        // Upload image to Supabase Storage instead of storing base64
                                        const { publicUrl, error: uploadError } = await uploadImageToStorage(
                                            imageFile.base64,
                                            imageFile.mimeType,
                                            `generated-${Date.now()}-${Math.random().toString(36).substring(2, 15)}.${imageFile.mimeType.split('/')[1]}`
                                        );

                                        if (uploadError || !publicUrl) {
                                            return {
                                                prompt: params.prompt,
                                                imageUrl: null,
                                                error: uploadError || "Failed to upload image to storage",
                                                aspectRatio: params.aspectRatio,
                                                isGenerating: false,
                                                success: false,
                                            }
                                        }

                                        return {
                                            prompt: params.prompt,
                                            imageUrl: publicUrl,
                                            aspectRatio: params.aspectRatio,
                                            isGenerating: false,
                                            success: true,
                                            error: null,
                                        }
                                    } else {
                                        return {
                                            prompt: params.prompt,
                                            imageUrl: null,
                                            error: "Image data not available",
                                            aspectRatio: params.aspectRatio,
                                            isGenerating: false,
                                            success: false,
                                        }
                                    }
                                } else {
                                    return {
                                        prompt: params.prompt,
                                        imageUrl: null,
                                        error: "No image was generated",
                                        aspectRatio: params.aspectRatio,
                                        isGenerating: false,
                                        success: false,
                                    }
                                }
                            } else {
                                return {
                                    prompt: params.prompt,
                                    imageUrl: null,
                                    error: "No image was generated",
                                    aspectRatio: params.aspectRatio,
                                    isGenerating: false,
                                    success: false,
                                }
                            }
                        } catch (error) {
                            return {
                                prompt: params.prompt,
                                imageUrl: null,
                                error: error instanceof Error ? error.message : "Failed to generate image",
                                aspectRatio: params.aspectRatio,
                                isGenerating: false,
                                success: false,
                            }
                        }
                    },
                })
            },
            system: systemPrompt,
            onFinish: async (result) => {
                // Save assistant response with tool results (only if we have valid conversation ID)
                if (validConversationId) {
                    // Extract tool invocations and their results
                    const toolResults = result.toolResults?.map(toolResult => ({
                        toolCallId: `tool-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                        toolName: toolResult.toolName,
                        args: toolResult.args,
                        result: toolResult.result,
                        state: 'result'
                    })) || [];
                    
                    await saveMessageToDatabase(validConversationId, 'assistant', result.text, toolResults);
                }
            }
        })

        return result.toDataStreamResponse()
    } catch (error) {
        if (error instanceof Error && error.message === 'Authentication required') {
            return new Response(
                JSON.stringify({ error: 'Authentication required' }),
                { status: 401, headers: { "Content-Type": "application/json" } }
            );
        }
        
        return new Response(
            JSON.stringify({
                error: "Internal server error",
                details: error instanceof Error ? error.message : "Unknown error",
            }),
            {
                status: 500,
                headers: { "Content-Type": "application/json" },
            },
        )
    }
}

// Helper function to save message to database with tool results
async function saveMessageToDatabase(conversationId: string, role: 'user' | 'assistant', content: string, toolResults?: any[]) {
  try {
    const supabase = await createServerSupabaseClient();
    
    // Prepare metadata for tool results
    let metadata = null;
    if (toolResults && toolResults.length > 0) {
      metadata = {
        toolResults: toolResults,
        hasTools: true,
        toolCount: toolResults.length
      };
    }
    
    const { data: message, error } = await supabase
      .from('messages')
      .insert({
        conversation_id: conversationId,
        role: role,
        content: content,
        metadata: metadata,
        status: 'completed'
      })
      .select()
      .single();

    if (error) {
      return null;
    }

    // Save any images from tool results to message_images table
    if (message && toolResults) {
      const imagePromises = [];
      const processedImageUrls = new Set(); // Track processed URLs to avoid duplicates
      
      for (const tool of toolResults) {
        // Handle generateImage tool specifically
        if (tool.result && tool.toolName === 'generateImage' && tool.result.imageUrl) {
          if (!processedImageUrls.has(tool.result.imageUrl)) {
            processedImageUrls.add(tool.result.imageUrl);
            imagePromises.push(
              supabase.from('message_images').insert({
                message_id: message.id,
                image_url: tool.result.imageUrl,
                alt_text: tool.result.prompt || 'Generated image'
              })
            );
          }
        }
        
        // Handle product cards specifically
        else if (tool.toolName === 'generateProductCard' && tool.result) {
          const products = Array.isArray(tool.result) ? tool.result : [tool.result];
          
          for (const product of products) {
            if (product.imageUrl && !processedImageUrls.has(product.imageUrl)) {
              processedImageUrls.add(product.imageUrl);
              imagePromises.push(
                supabase.from('message_images').insert({
                  message_id: message.id,
                  image_url: product.imageUrl,
                  alt_text: product.imageAlt || product.title || 'Product image'
                })
              );
            }
          }
        }
        
        // Handle other specific tool types that might have images
        // (Add more specific handlers here for other tools if needed)
      }
      
      // Execute all image insertions in parallel
      if (imagePromises.length > 0) {
        try {
          await Promise.all(imagePromises);
        } catch (imageError) {
          // Silent fail for image saving
        }
      }
    }

    return message;
  } catch (error) {
    return null;
  }
}