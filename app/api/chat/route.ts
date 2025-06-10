import { createGoogleGenerativeAI } from "@ai-sdk/google"
import { streamText, generateText, tool } from "ai"
import { z } from "zod"

export const maxDuration = 30

export async function POST(req: Request) {
    try {
        const { messages } = await req.json()
        const apiKey = req.headers.get("x-api-key")


        const google = createGoogleGenerativeAI({
            apiKey: apiKey || process.env.GOOGLE_GENERATIVE_AI_API_KEY,
        })

        const model = google("gemini-2.0-flash")

        console.log("Model created successfully")

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
                        console.log("Executing generateProductCard tool:", params)

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
                        console.log("Executing generateWeatherCard tool:", params)

                        try {
                            const apiKey = process.env.ACCUWEATHER_API_KEY
                            if (!apiKey) {
                                throw new Error("AccuWeather API key not configured")
                            }

                            const locationSearchUrl = `https://dataservice.accuweather.com/locations/v1/cities/search?apikey=${apiKey}&q=${encodeURIComponent(params.location)}`
                            console.log("Searching for location:", params.location)

                            const locationResponse = await fetch(locationSearchUrl)
                            const locationData = await locationResponse.json()

                            if (!locationData || locationData.length === 0) {
                                throw new Error(`Location "${params.location}" not found`)
                            }

                            const locationKey = locationData[0].Key
                            const locationName = `${locationData[0].LocalizedName}, ${locationData[0].Country?.LocalizedName || locationData[0].AdministrativeArea?.LocalizedName}`

                            // Get current weather conditions
                            const weatherUrl = `https://dataservice.accuweather.com/currentconditions/v1/${locationKey}?apikey=${apiKey}&details=true`
                            console.log("Fetching weather for location key:", locationKey)

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
                            console.error("AccuWeather API error:", error)

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
                        console.log("Executing generateStockCard tool:", params)

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

                            // Try different ticker formats
                            for (const tickerVariant of indianStockPatterns) {
                                try {
                                    console.log(`Trying ticker variant: ${tickerVariant}`)

                                    // Fetch quote data
                                    const quoteUrl = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${tickerVariant}&apikey=${apiKey}`
                                    const quoteResponse = await fetch(quoteUrl)
                                    const tempQuoteData = await quoteResponse.json()

                                    // Check if we got valid data
                                    if (tempQuoteData["Global Quote"] && tempQuoteData["Global Quote"]["05. price"]) {
                                        quoteData = tempQuoteData
                                        finalTicker = tickerVariant
                                        console.log(`Success with ticker: ${tickerVariant}`)
                                        break
                                    }
                                } catch (error) {
                                    console.log(`Failed with ticker variant: ${tickerVariant}`, error)
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
                                console.log("Failed to fetch overview data:", error)
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
                                chartData: null, // Would need additional API call for historical data
                            }
                        } catch (error) {
                            console.error("Alpha Vantage API error:", error)

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
                                chartData: null,
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
                        console.log("Executing generateImage tool:", params)

                        try {
                            // Create image generation model
                            const imageModel = google("gemini-2.0-flash-exp")

                            console.log("Generating image with prompt:", params.prompt)

                            const result = await generateText({
                                model: imageModel,
                                prompt: `Generate an image: ${params.prompt}`,
                                providerOptions: {
                                    google: { responseModalities: ["TEXT", "IMAGE"] },
                                },
                            })

                            console.log("Image generation result:", {
                                hasFiles: !!result.files,
                                filesLength: result.files?.length || 0,
                                files: result.files?.map((f) => ({
                                    mimeType: f.mimeType,
                                    hasBase64: !!f.base64,
                                    hasUint8Array: !!f.uint8Array,
                                    base64Length: f.base64?.length || 0,
                                })),
                            })

                            // Check if files were generated
                            if (result.files && result.files.length > 0) {
                                // Find the first image file
                                const imageFile = result.files.find((file) => file.mimeType.startsWith("image/"))

                                if (imageFile) {
                                    console.log("Image file found:", {
                                        mimeType: imageFile.mimeType,
                                        hasBase64: !!imageFile.base64,
                                        base64Length: imageFile.base64?.length || 0,
                                    })

                                    // Use the base64 property directly from the AI SDK
                                    if (imageFile.base64) {
                                        const imageUrl = `data:${imageFile.mimeType};base64,${imageFile.base64}`

                                        return {
                                            prompt: params.prompt,
                                            imageUrl: imageUrl,
                                            aspectRatio: params.aspectRatio,
                                            isGenerating: false,
                                            success: true,
                                            error: null,
                                        }
                                    } else {
                                        console.log("No base64 data found in image file")
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
                                    console.log("No image file found in result")
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
                                console.log("No files in result")
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
                            console.error("Image generation error:", error)
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
                }),
                generateMediaRecommendations: tool({
                    description: "Generate media recommendation(s) based on user preferences. Can generate multiple recommendations if count > 1.",
                    parameters: z.object({
                        count: z.number().min(1).max(10).optional().describe("Number of recommendations to generate").default(1),
                        title: z.string().describe("Media title"),
                        genre: z.string().describe("Media genre"),
                        platform: z.string().describe("Streaming platform"),
                        rating: z.number().min(0).max(5).describe("Rating out of 5"),
                        duration: z.string().optional().describe("Duration or runtime"),
                        imageUrl: z.string().describe("Media poster or cover image URL"),
                        type: z.enum(["movie", "tv", "music"]).describe("Type of media"),
                    }),
                    execute: async (params) => {
                        console.log("Executing generateMediaRecommendations tool:", params)

                        if (params.count === 1) {
                            return params
                        }

                        // Generate array of recommendations
                        const recommendations = []
                        for (let i = 0; i < params.count; i++) {
                            recommendations.push({
                                ...params,
                                title: `${params.title} ${i + 1}`,
                            })
                        }

                        return recommendations
                    },
                }),
                webSearch: tool({
                    description: "Search the web for current information, news, facts, or any topic. Use this tool to get up-to-date information and then incorporate the findings naturally into your response.",
                    parameters: z.object({
                        query: z.string().describe("Search query to find current information about"),
                        maxResults: z.number().min(1).max(10).default(5).describe("Maximum number of search results to analyze"),
                    }),
                    execute: async (params) => {
                        console.log("Executing webSearch tool:", params)

                        try {
                            const apiKey = process.env.GOOGLE_SEARCH_API_KEY

                            if (!apiKey) {
                                throw new Error("Google Search API key not configured")
                            }

                            const searchEngineId = process.env.GOOGLE_SEARCH_ENGINE_ID

                            const searchUrl = `https://www.googleapis.com/customsearch/v1?key=${apiKey}&cx=${searchEngineId}&q=${encodeURIComponent(params.query)}&num=${params.maxResults}`

                            console.log("Searching for:", params.query)

                            const response = await fetch(searchUrl)
                            const data = await response.json()

                            if (!response.ok) {
                                console.error("Search API error:", data)
                                throw new Error(data.error?.message || "Search API request failed")
                            }

                            if (!data.items || data.items.length === 0) {
                                return {
                                    success: false,
                                    message: "No search results found for this query.",
                                    query: params.query,
                                    citations: []
                                }
                            }

                            // Format search results for AI processing and citations
                            const searchResults = data.items.map((item: any, index: number) => ({
                                title: item.title,
                                snippet: item.snippet,
                                url: item.link,
                                source: item.displayLink,
                                position: index + 1
                            }))

                            // Create formatted content for AI to use (without citations)
                            const searchContent = searchResults.map((result: any) => 
                                `${result.title}\n${result.snippet}\nSource: ${result.source}`
                            ).join('\n\n')

                            // Create citations for the card
                            const citations = searchResults.map((result: any) => ({
                                title: result.title,
                                url: result.url,
                                source: result.source,
                                snippet: result.snippet
                            }))

                            return {
                                success: true,
                                query: params.query,
                                results: searchResults,
                                searchContent: searchContent,
                                citations: citations,
                                totalResults: parseInt(data.searchInformation?.totalResults || "0"),
                                searchTime: parseFloat(data.searchInformation?.searchTime || "0")
                            }

                        } catch (error) {
                            console.error("Google Search API error:", error)

                            return {
                                success: false,
                                message: "Unable to perform web search at this time.",
                                query: params.query,
                                citations: [],
                                error: error instanceof Error ? error.message : "Failed to perform web search"
                            }
                        }
                    }
                })
            },
            system: `You are T3 Chat, a helpful AI assistant powered by Google's Gemini model. T3 Chat was created by Grenish Rai for the clonethon project, showcasing modern AI capabilities through interactive conversations.

Current date: ${new Date().toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric',
                timeZone: 'UTC'
            })}

You're a knowledgeable assistant who can help with a wide variety of tasks including:
- Answering questions on virtually any topic
- Providing explanations and educational content
- Writing and editing text
- Coding assistance and programming help
- Creative writing and brainstorming
- Problem-solving and analysis
- General conversation and advice

You also have some special capabilities that enhance the user experience:
- When users want to see product information, you can create visual product cards
- For weather queries, you can display weather information in a nice card format
- When asked about stocks, you can fetch real-time stock data and show it visually
- You can generate images from text descriptions when users ask for visual content
- For entertainment recommendations (movies, TV shows, music), you can create recommendation cards

For image generation:
- Use the generateImage tool when users want to create, generate, draw, or visualize something
- Enhance prompts with artistic details for better results
- Be creative and suggest improvements to user prompts

For web search - IMPORTANT INSTRUCTIONS:
- ALWAYS use the webSearch tool when users ask for current information, recent news, facts, or anything that requires up-to-date data
- After using the webSearch tool, IMMEDIATELY analyze and synthesize the search results in your response
- When the webSearch tool returns results, use the searchContent from the results to provide a comprehensive answer
- Integrate the information naturally into your response as if it's part of your knowledge
- DO NOT include numbered citations like [1], [2] in your response text
- Present the information naturally without referencing specific sources in the text
- The sources will be displayed separately in a citation card below your response

Example of how to handle web search results:
User asks: "What are the latest AI trends?"
1. Use webSearch tool with query "latest AI trends 2024"
2. Process the results and write a comprehensive response like:
"Based on recent developments, the latest AI trends include generative AI advancement, multimodal capabilities, and improved efficiency. Another major trend is the integration of AI into everyday applications..."
3. Do NOT add any source citations in the text - they will appear automatically in a citation card

When providing code:
- Use proper markdown code blocks with language specification: \`\`\`javascript, \`\`\`python, etc.
- Use inline code with backticks for short snippets: \`const example = "code"\`
- Always specify the programming language for syntax highlighting

CRITICAL: When you receive webSearch tool results, you MUST process and present that information in your response. Do not just acknowledge that you searched - actually use the search results to answer the user's question comprehensively. The sources will be shown separately, so focus on providing a clear, informative answer.

Be natural, conversational, and helpful. Don't just list your capabilities - engage with what the user actually wants to discuss or accomplish. You're here to assist with whatever they need, whether it's a simple question, a complex problem, or just a friendly chat.`,
        })

        console.log("StreamText result created")
        return result.toDataStreamResponse()
    } catch (error) {
        console.error("Chat API error:", error)
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
