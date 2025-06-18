import { defaultPrompt } from "@/prompt/default/default-prompt"
import { taylorSwiftPrompt } from "@/prompt/persona/taylor-swift-prompt"
import { sundarPichaiPrompt } from "@/prompt/persona/sundar-pichai-prompt"
import { createGoogleGenerativeAI } from "@ai-sdk/google"
import { streamText, generateText, tool, experimental_generateImage as generateImage } from "ai"
import { z } from "zod"
import { createServerSupabaseClient, requireAuth, uploadImageToStorage } from '@/lib/supabase-server';
import { theoPrompt } from "@/prompt/persona/theo-prompt"
import { billGatesPrompt } from "@/prompt/persona/billgates-prompt"

export const maxDuration = 30

// Cache AI client globally for better performance
let googleAIClient: any = null;
function getGoogleAI(apiKey?: string) {
  if (!googleAIClient) {
    googleAIClient = createGoogleGenerativeAI({
      apiKey: apiKey || process.env.GOOGLE_GENERATIVE_AI_API_KEY,
    });
  }
  return googleAIClient;
}

// FIXED: Add request deduplication to prevent multiple simultaneous conversation creation
const pendingConversationRequests = new Map<string, Promise<string>>();

// Cache user preferences globally with TTL
const userPreferencesCache = new Map<string, { data: any; timestamp: number }>();
const PREFERENCES_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Create optional authentication helper
async function getOptionalAuth(req: Request): Promise<{ user: any | null; userId: string | null; isAuthenticated: boolean }> {
  try {
    // Check if user is authenticated via headers set by middleware
    const isAuthenticated = req.headers.get('x-user-authenticated') === 'true';
    const userId = req.headers.get('x-user-id');
    
    if (isAuthenticated && userId) {
      // For authenticated users, get full user object
      const supabase = await createServerSupabaseClient();
      const { data: { user }, error } = await supabase.auth.getUser();
      
      if (!error && user) {
        return { user, userId: user.id, isAuthenticated: true };
      }
    }
    
    // Return guest user info
    return { user: null, userId: null, isAuthenticated: false };
  } catch (error) {
    // If authentication fails, treat as guest
    return { user: null, userId: null, isAuthenticated: false };
  }
}

// Optimized user preferences fetching with caching (now handles guest users)
async function getUserPreferences(userId: string | null, supabase: any) {
  if (!userId) {
    // Return null for guest users (no personalization)
    return null;
  }

  const cacheKey = `prefs_${userId}`;
  const cached = userPreferencesCache.get(cacheKey);
  
  if (cached && Date.now() - cached.timestamp < PREFERENCES_CACHE_TTL) {
    return cached.data;
  }

  // Fetch both preferences and memories
  const [preferencesResult, memoriesResult] = await Promise.all([
    supabase
      .from('user_preferences')
      .select('*')
      .eq('user_id', userId)
      .single(),
    supabase
      .from('user_memory')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .order('updated_at', { ascending: false })
  ]);

  const userPreferences = preferencesResult.data;
  const userMemories = memoriesResult.data || [];

  // Combine preferences with memories
  const enrichedPreferences = {
    ...userPreferences,
    memories: userMemories
  };

  if (enrichedPreferences) {
    userPreferencesCache.set(cacheKey, { 
      data: enrichedPreferences, 
      timestamp: Date.now() 
    });
  }

  return enrichedPreferences;
}

// Optimized system prompt generation with caching
const systemPromptCache = new Map<string, string>();

function getSystemPrompt(persona: string | null, userPreferences: any): string {
  const cacheKey = `${persona || 'default'}_${JSON.stringify(userPreferences)}`;
  
  if (systemPromptCache.has(cacheKey)) {
    return systemPromptCache.get(cacheKey)!;
  }

  let systemPrompt = defaultPrompt();

  // Select system prompt based on persona
  if (persona) {
    switch (persona.toLowerCase()) {
      case 'theo':
        systemPrompt = theoPrompt();
        break;
      case 'taylor swift':
        systemPrompt = taylorSwiftPrompt();
        break;
      case 'sundar pichai':
        systemPrompt = sundarPichaiPrompt();
        break;
      case 'bill gates':
        systemPrompt = billGatesPrompt();
        break;
      default:
        systemPrompt = defaultPrompt();
    }
  }

  if (userPreferences) {
    let personalizationContext = `

USER PERSONALIZATION CONTEXT:
${userPreferences.display_name ? `- User's preferred name: ${userPreferences.display_name}` : ''}
${userPreferences.occupation ? `- User's occupation: ${userPreferences.occupation}` : ''}
${userPreferences.traits && userPreferences.traits.length > 0 ? `- User's traits/interests: ${userPreferences.traits.join(', ')}` : ''}
${userPreferences.additional_info ? `- Additional user context: ${userPreferences.additional_info}` : ''}`;

    // Add user memories to the context
    if (userPreferences.memories && userPreferences.memories.length > 0) {
      personalizationContext += `

USER MEMORIES (Things the user wants you to remember):`;
      
      userPreferences.memories.forEach((memory: any) => {
        const memoryContent = memory.memory_value?.content || memory.memory_value;
        personalizationContext += `
- ${memory.memory_key}: ${memoryContent} (${memory.memory_type || 'custom'})`;
      });
    }

    personalizationContext += `

Please use this information to personalize your responses appropriately${persona ? ' while maintaining your persona' : ''}. Address the user by their preferred name when appropriate, and tailor your responses to their occupation, interests, and context when relevant. Remember and reference the user's saved memories when they are relevant to the conversation.`;

    systemPrompt += personalizationContext;
  }

  // Cache the result
  systemPromptCache.set(cacheKey, systemPrompt);
  
  return systemPrompt;
}

async function uploadFileToStorage(fileData: string, mimeType: string, filename: string, userId: string, supabase: any): Promise<{ publicUrl: string | null; error: string | null; documentId: string | null }> {
    try {
        // Convert base64 to buffer
        const base64Data = fileData.split(',')[1];
        const buffer = Buffer.from(base64Data, 'base64');
        
        // Generate unique filename
        const fileExtension = filename.split('.').pop() || 'bin';
        const uniqueFilename = `${userId}/${Date.now()}-${Math.random().toString(36).substring(2, 15)}.${fileExtension}`;
        
        // Upload to Supabase Storage
        const { data: uploadData, error: uploadError } = await supabase.storage
            .from('user-documents')
            .upload(uniqueFilename, buffer, {
                contentType: mimeType,
                cacheControl: '3600'
            });

        if (uploadError) {
            return { publicUrl: null, error: uploadError.message, documentId: null };
        }

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
            .from('user-documents')
            .getPublicUrl(uniqueFilename);

        return { publicUrl, error: null, documentId: uniqueFilename };
    } catch (error) {
        return { 
            publicUrl: null, 
            error: error instanceof Error ? error.message : 'Unknown upload error', 
            documentId: null 
        };
    }
}

export async function POST(req: Request) {
    try {
        const { messages, persona, conversationId, modelId, files, webSearchEnabled = false } = await req.json()
        const apiKey = req.headers.get("x-api-key")

        // Use optional authentication - allow both authenticated and guest users
        const { user, userId, isAuthenticated } = await getOptionalAuth(req);

        // Use centralized Supabase client creation only for authenticated users
        let supabase: any = null;
        if (isAuthenticated) {
            supabase = await createServerSupabaseClient();
        }
        
        // Fetch user preferences with caching (null for guest users)
        const userPreferences = await getUserPreferences(userId, supabase);

        // Initialize conversationId tracking
        let validConversationId: string | null = null;
        
        // Only handle conversation management for authenticated users
        if (isAuthenticated && userId && supabase) {
            // Check if conversationId is provided and valid
            if (conversationId && typeof conversationId === 'string' && conversationId.trim()) {
                const trimmedId = conversationId.trim();
                
                // Skip temp IDs
                if (trimmedId.startsWith('temp-')) {
                    // Skip temp IDs
                } else {
                    // Validate UUID format
                    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
                    if (uuidRegex.test(trimmedId)) {
                        // Verify the conversation exists and belongs to the user
                        try {
                            const { data: conversation, error } = await supabase
                                .from('conversations')
                                .select('id')
                                .eq('id', trimmedId)
                                .eq('user_id', userId)
                                .single();
                        
                            if (!error && conversation) {
                                validConversationId = trimmedId;
                            }
                        } catch (dbError) {
                            // Handle silently
                        }
                    }
                }
            }
            
            // If no valid conversation ID exists, create a new one ONLY ONCE per chat session
            if (!validConversationId) {
                try {
                    // Get first user message for title
                    const firstUserMsg = messages.find((m: any) => m.role === 'user');
                    const title = firstUserMsg 
                        ? firstUserMsg.content.substring(0, 100) 
                        : 'New Chat';
                    
                    // FIXED: Use request deduplication to prevent multiple simultaneous conversation creation
                    const deduplicationKey = `${userId}-${title}`;
                    
                    // Check if there's already a pending request for this exact conversation
                    if (pendingConversationRequests.has(deduplicationKey)) {
                        validConversationId = await pendingConversationRequests.get(deduplicationKey)!;
                    } else {
                        // Create a new promise for this conversation creation
                        const createConversationPromise = (async (): Promise<string> => {
                            // Check if conversation already exists with this exact title recently
                            const recentTime = new Date(Date.now() - 10000).toISOString(); // 10 seconds ago
                            const { data: existingConversations, error: checkError } = await supabase
                                .from('conversations')
                                .select('id')
                                .eq('user_id', userId)
                                .eq('title', title)
                                .gte('created_at', recentTime);

                            if (!checkError && existingConversations && existingConversations.length > 0) {
                                // Use existing conversation instead of creating a new one
                                const existingId = existingConversations[0].id;
                                return existingId;
                            } else {
                                // Create new conversation only if no recent duplicate exists
                                const { data: newConversation, error } = await supabase
                                    .from('conversations')
                                    .insert({
                                        user_id: userId,
                                        title: title
                                    })
                                    .select()
                                    .single();
                                
                                if (error) {
                                    throw new Error('Failed to create conversation');
                                } else {
                                    return newConversation.id;
                                }
                            }
                        })();
                        
                        // Store the promise in the map
                        pendingConversationRequests.set(deduplicationKey, createConversationPromise);
                        
                        try {
                            validConversationId = await createConversationPromise;
                        } finally {
                            // Clean up the pending request after 30 seconds
                            setTimeout(() => {
                                pendingConversationRequests.delete(deduplicationKey);
                            }, 30000);
                        }
                    }
                } catch (createError) {
                    // Continue without saving to DB
                }
            }
        }

        // Process files if they exist (skip file upload for guest users)
        let processedMessages = messages;
        let uploadedDocuments: any[] = [];
        
        if (files && files.length > 0) {
            // Find the last user message and add files to it
            const lastUserMessageIndex = messages.length - 1;
            const lastMessage = messages[lastUserMessageIndex];
            
            if (lastMessage && lastMessage.role === 'user') {
                // Convert the content to multimodal format
                const contentParts = [];
                
                // Add the text content
                if (typeof lastMessage.content === 'string') {
                    contentParts.push({
                        type: 'text',
                        text: lastMessage.content
                    });
                } else if (Array.isArray(lastMessage.content)) {
                    contentParts.push(...lastMessage.content);
                }
                
                // Process each file
                for (const file of files) {
                    try {
                        // Convert base64 data URL to buffer
                        const base64Data = file.data.split(',')[1]; // Remove data URL prefix
                        const buffer = Buffer.from(base64Data, 'base64');
                        
                        // Determine content type based on MIME type
                        if (file.type.startsWith('image/')) {
                            contentParts.push({
                                type: 'image',
                                image: buffer,
                            });
                        } else if (file.type === 'application/pdf') {
                            // For authenticated users, upload PDF and use public URL
                            if (isAuthenticated && userId && supabase) {
                                const { publicUrl, error: uploadError, documentId } = await uploadFileToStorage(
                                    file.data, 
                                    file.type, 
                                    file.name, 
                                    userId, 
                                    supabase
                                );
                                
                                if (publicUrl && !uploadError) {
                                    // For PDFs, we need to use the file approach with public URL
                                    const response = await fetch(publicUrl);
                                    const arrayBuffer = await response.arrayBuffer();
                                    const pdfBuffer = Buffer.from(arrayBuffer);
                                    
                                    contentParts.push({
                                        type: 'file',
                                        mimeType: file.type,
                                        data: pdfBuffer,
                                        filename: file.name,
                                    });
                                    
                                    uploadedDocuments.push({
                                        filename: file.name,
                                        mimeType: file.type,
                                        size: file.size,
                                        documentUrl: publicUrl,
                                        documentId: documentId
                                    });
                                } else {
                                    contentParts.push({
                                        type: 'text',
                                        text: `[Error uploading file: ${file.name}]`
                                    });
                                }
                            } else {
                                // For guest users, skip PDF upload but still try to process
                                contentParts.push({
                                    type: 'text',
                                    text: `[PDF file: ${file.name} - File upload not available for guest users]`
                                });
                            }
                        } else if (file.type.startsWith('text/') || 
                                   file.type === 'application/json' ||
                                   file.type.includes('csv') ||
                                   file.type.includes('xml') ||
                                   file.name.endsWith('.txt') ||
                                   file.name.endsWith('.md') ||
                                   file.name.endsWith('.json') ||
                                   file.name.endsWith('.csv') ||
                                   file.name.endsWith('.xml')) {
                            // For text files, read the content and add as text
                            const textContent = buffer.toString('utf-8');
                            contentParts.push({
                                type: 'text',
                                text: `File: ${file.name}\n\nContent:\n${textContent}`
                            });
                            
                            // Also upload text files to storage for authenticated users
                            if (isAuthenticated && userId && supabase) {
                                const { publicUrl, documentId } = await uploadFileToStorage(
                                    file.data, 
                                    file.type, 
                                    file.name, 
                                    userId, 
                                    supabase
                                );
                                
                                if (publicUrl) {
                                    uploadedDocuments.push({
                                        filename: file.name,
                                        mimeType: file.type,
                                        size: file.size,
                                        documentUrl: publicUrl,
                                        documentId: documentId
                                    });
                                }
                            }
                        } else {
                            // For other supported file types, upload for authenticated users only
                            if (isAuthenticated && userId && supabase) {
                                const { publicUrl, error: uploadError, documentId } = await uploadFileToStorage(
                                    file.data, 
                                    file.type, 
                                    file.name, 
                                    userId, 
                                    supabase
                                );
                                
                                if (publicUrl && !uploadError) {
                                    contentParts.push({
                                        type: 'file',
                                        mimeType: file.type,
                                        data: buffer,
                                        filename: file.name,
                                    });
                                    
                                    uploadedDocuments.push({
                                        filename: file.name,
                                        mimeType: file.type,
                                        size: file.size,
                                        documentUrl: publicUrl,
                                        documentId: documentId
                                    });
                                } else {
                                    contentParts.push({
                                        type: 'text',
                                        text: `[Error uploading file: ${file.name}]`
                                    });
                                }
                            } else {
                                // For guest users, show message about file upload limitation
                                contentParts.push({
                                    type: 'text',
                                    text: `[File: ${file.name} - File upload not available for guest users. Sign in to upload files.]`
                                });
                            }
                        }
                    } catch (fileError) {
                        contentParts.push({
                            type: 'text',
                            text: `[Error processing file: ${file.name}]`
                        });
                    }
                }
                
                // Update the message with multimodal content
                processedMessages = [...messages];
                processedMessages[lastUserMessageIndex] = {
                    ...lastMessage,
                    content: contentParts
                };
            }
        }

        // Get the latest user message to save to database (only for authenticated users)
        const latestUserMessage = processedMessages[processedMessages.length - 1];
        let savedMessageId: string | null = null;
        
        if (latestUserMessage && latestUserMessage.role === 'user' && validConversationId && isAuthenticated && supabase) {
            try {
                let contentToSave = '';
                let messageMetadata: any = null;
                
                if (Array.isArray(latestUserMessage.content)) {
                    // Extract text parts for the main content
                    const textParts = latestUserMessage.content
                        .filter((part: any) => part.type === 'text')
                        .map((part: any) => part.text);
                    contentToSave = textParts.join('\n');
                    
                    // Store file information in metadata
                    const fileParts = latestUserMessage.content.filter((part: any) => 
                        part.type === 'image' || part.type === 'file'
                    );
                    
                    if (fileParts.length > 0) {
                        messageMetadata = {
                            attachments: fileParts.map((part: any) => ({
                                type: part.type,
                                mimeType: part.mimeType || (part.type === 'image' ? 'image/*' : 'application/octet-stream'),
                                filename: part.filename || 'attachment',
                                size: part.data ? Buffer.byteLength(part.data) : 0
                            }))
                        };
                    }
                } else {
                    contentToSave = latestUserMessage.content;
                }
                
                const { data: savedMessage, error } = await supabase
                    .from('messages')
                    .insert({
                        conversation_id: validConversationId,
                        role: 'user',
                        content: contentToSave,
                        metadata: messageMetadata,
                        status: 'completed'
                    })
                    .select()
                    .single();
                
                if (!error && savedMessage) {
                    savedMessageId = savedMessage.id;
                    
                    // Save uploaded documents to message_documents table
                    if (uploadedDocuments.length > 0) {
                        const documentInserts = uploadedDocuments.map(doc => ({
                            message_id: savedMessage.id,
                            document_url: doc.documentUrl,
                            name: doc.filename,
                            file_type: doc.mimeType,
                            size: doc.size
                        }));
                        
                        await supabase
                            .from('message_documents')
                            .insert(documentInserts);
                    }
                }
            } catch (saveError) {
                // Handle silently - don't fail the chat for DB errors
            }
        } else if (latestUserMessage && latestUserMessage.role === 'user') {
            // Do not save empty or invalid messages
        }

        const google = getGoogleAI(apiKey || undefined);
        
        // Handle thinking models - use the correct model ID
        const isThinkingModel = modelId === "gemini-2.5-flash-preview-05-20";
        let actualModelId = modelId || "gemini-2.0-flash";
        
        // For thinking model, use the exact model ID
        if (isThinkingModel) {
            actualModelId = "gemini-2.5-flash-preview-05-20";
        }
        
        // FIXED: Enable search grounding conditionally when webSearchEnabled is true and not a thinking model
        const model = webSearchEnabled && !isThinkingModel 
            ? google(actualModelId, { searchGrounding: true })
            : google(actualModelId);

        const systemPrompt = getSystemPrompt(persona, userPreferences);

        const startTime = Date.now();

        const result = streamText({
            model,
            messages: processedMessages, // Use processed messages with file attachments
            tools: {
                saveMemory: tool({
                    description: "Save information about the user to memory for future conversations. Use this when the user shares personal preferences, interests, or information they want you to remember. Save information in a natural, conversational way that preserves the original context and meaning.",
                    parameters: z.object({
                        key: z.string().describe("A descriptive key for the memory (e.g., 'favorite_music', 'food_preferences', 'hobbies')"),
                        value: z.string().describe("The information to remember - save it naturally as you would want to recall it later"),
                        type: z.enum(["preference", "fact", "interest", "goal", "custom"]).optional().describe("Category of memory").default("custom"),
                    }),
                    execute: async (params) => {
                        try {
                            // Only save memories for authenticated users
                            if (!isAuthenticated || !userId || !supabase) {
                                return {
                                    success: false,
                                    error: "Memory saving is only available for signed-in users",
                                    key: params.key,
                                    value: params.value,
                                };
                            }

                            const user = await requireAuth();
                            
                            // Save the memory value as provided by the AI, without forced formatting
                            // The AI can decide how to best phrase and contextualize the memory
                            const formattedValue = params.value;
                            
                            // Upsert the memory (insert or update if exists)
                            const { data: memory, error } = await supabase
                                .from('user_memory')
                                .upsert({
                                    user_id: user.id,
                                    memory_key: params.key,
                                    memory_value: { content: formattedValue },
                                    memory_type: params.type,
                                    is_active: true,
                                }, {
                                    onConflict: 'user_id,memory_key'
                                })
                                .select()
                                .single();

                            if (error) {
                                return {
                                    success: false,
                                    error: "Failed to save memory",
                                    key: params.key,
                                    value: formattedValue,
                                };
                            }

                            // Clear user preferences cache to include new memory
                            const cacheKey = `prefs_${user.id}`;
                            userPreferencesCache.delete(cacheKey);

                            return {
                                success: true,
                                key: params.key,
                                value: formattedValue,
                                type: params.type,
                                message: "I'll remember that for our future conversations!",
                            };
                        } catch (error) {
                            return {
                                success: false,
                                error: error instanceof Error ? error.message : "Failed to save memory",
                                key: params.key,
                                value: params.value,
                            };
                        }
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

                            // Add timeout to weather API call
                            const controller = new AbortController();
                            const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 second timeout

                            const locationSearchUrl = `https://dataservice.accuweather.com/locations/v1/cities/search?apikey=${apiKey}&q=${encodeURIComponent(params.location)}`

                            const locationResponse = await fetch(locationSearchUrl, {
                                signal: controller.signal,
                                headers: {
                                    'Accept': 'application/json',
                                    'User-Agent': 'T3Chat/1.0'
                                }
                            });
                            
                            clearTimeout(timeoutId);
                            
                            if (!locationResponse.ok) {
                                throw new Error(`Location API error: ${locationResponse.status}`);
                            }

                            const locationData = await locationResponse.json()

                            if (!locationData || locationData.length === 0) {
                                throw new Error(`Location "${params.location}" not found`)
                            }

                            const locationKey = locationData[0].Key
                            const locationName = `${locationData[0].LocalizedName}, ${locationData[0].Country?.LocalizedName || locationData[0].AdministrativeArea?.LocalizedName}`

                            // Get current weather conditions with timeout
                            const weatherController = new AbortController();
                            const weatherTimeoutId = setTimeout(() => weatherController.abort(), 8000);
                            
                            const weatherUrl = `https://dataservice.accuweather.com/currentconditions/v1/${locationKey}?apikey=${apiKey}&details=true`

                            const weatherResponse = await fetch(weatherUrl, {
                                signal: weatherController.signal,
                                headers: {
                                    'Accept': 'application/json',
                                    'User-Agent': 'T3Chat/1.0'
                                }
                            });
                            
                            clearTimeout(weatherTimeoutId);

                            if (!weatherResponse.ok) {
                                throw new Error(`Weather API error: ${weatherResponse.status}`);
                            }

                            const weatherData = await weatherResponse.json()

                            if (!weatherData || weatherData.length === 0) {
                                throw new Error("Weather data not available for this location")
                            }

                            const currentWeather = weatherData[0]

                            // Extract weather information with safe parsing
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
            experimental_telemetry: {
                isEnabled: true,
                recordInputs: false,
                recordOutputs: false,
            },
            // FIXED: Proper thinking model configuration
            ...(isThinkingModel && {
                experimental_providerOptions: {
                    google: {
                        thinkingModel: true,
                        enableThinking: true,
                    },
                },
            }),
            onFinish: async (result) => {
                // Calculate response time
                const responseTime = Date.now() - startTime;

                // Save assistant response with tool results, thinking, and metrics (only for authenticated users)
                if (validConversationId && isAuthenticated && supabase) {
                    try {
                        // Extract tool invocations and their results
                        const toolResults = result.toolResults?.map(toolResult => ({
                            toolCallId: `tool-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                            toolName: toolResult.toolName,
                            args: toolResult.args,
                            result: toolResult.result,
                            state: 'result'
                        })) || [];
                        
                        // FIXED: Enhanced thinking content extraction for Gemini thinking models
                        let thinkingContent = null;
                        
                        if (isThinkingModel) {
                            // For Gemini thinking models, check the experimental_thinking property first
                            if ((result as any).experimental_thinking) {
                                thinkingContent = (result as any).experimental_thinking;
                            }
                            // Also check other possible properties
                            else if ((result as any).steps) {
                                const steps = (result as any).steps;
                                
                                if (typeof steps === 'string') {
                                    thinkingContent = steps;
                                } else if (typeof steps === 'object' && steps !== null) {
                                    // Extract text from steps object
                                    if (steps.text) {
                                        thinkingContent = steps.text;
                                    } else if (steps.content) {
                                        thinkingContent = steps.content;
                                    } else if (steps.stepType && steps.text) {
                                        thinkingContent = steps.text;
                                    } else {
                                        // Convert object to readable format
                                        thinkingContent = JSON.stringify(steps, null, 2);
                                    }
                                }
                            }
                            // Check reasoning property
                            else if ((result as any).reasoning) {
                                thinkingContent = (result as any).reasoning;
                            }
                            
                            if (thinkingContent && typeof thinkingContent === 'string') {
                            }
                        }
                        
                        // Prepare metadata for tool results and thinking
                        let metadata = null;
                        if (toolResults.length > 0 || thinkingContent) {
                            metadata = {
                                toolResults: toolResults,
                                hasTools: toolResults.length > 0,
                                toolCount: toolResults.length,
                                thinking: thinkingContent,
                                hasThinking: !!thinkingContent,
                                // Add raw thinking data for debugging
                                rawThinking: isThinkingModel ? {
                                    experimental_thinking: (result as any).experimental_thinking,
                                    steps: (result as any).steps,
                                    reasoning: (result as any).reasoning
                                } : null
                            };
                        }
                        
                        // Save assistant message with metrics and thinking
                        const { data: assistantMessage, error } = await supabase
                            .from('messages')
                            .insert({
                                conversation_id: validConversationId,
                                role: 'assistant',
                                content: result.text,
                                model_used: modelId || "gemini-2.0-flash",
                                token_usage: result.usage?.totalTokens || null,
                                response_time_ms: responseTime,
                                metadata: metadata,
                                status: 'completed'
                            })
                            .select()
                            .single();
                        
                        if (error) {
                            // Handle silently
                        } else {
                            if (thinkingContent) {
                            }
                            
                            // Save any images from tool results
                            if (toolResults.length > 0) {
                                await saveToolResultImages(assistantMessage.id, toolResults, supabase);
                            }
                        }
                    } catch (saveError) {
                        // Handle silently - don't fail the chat for DB errors
                    }
                } else {
                    // No valid conversation ID or unauthenticated - assistant response will not be saved to database
                }
            }
        });

        // CRITICAL: Return the conversation ID in the response headers so the frontend can use it
        const headers: Record<string, string> = {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0',
            'X-User-Authenticated': isAuthenticated ? 'true' : 'false',
        };

        if (validConversationId) {
            headers['X-Conversation-ID'] = validConversationId;
        }

        return result.toDataStreamResponse({ headers });
    } catch (error) {
        // Remove authentication requirement from error handling
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

// Function for saving tool result images
async function saveToolResultImages(messageId: string, toolResults: any[], supabase: any) {
    try {
        const imagePromises = [];
        const processedImageUrls = new Set(); // Track processed URLs to avoid duplicates
        
        for (const tool of toolResults) {
            // Handle generateImage tool specifically
            if (tool.result && tool.toolName === 'generateImage' && tool.result.imageUrl) {
                if (!processedImageUrls.has(tool.result.imageUrl)) {
                    processedImageUrls.add(tool.result.imageUrl);
                    imagePromises.push(
                        supabase.from('message_images').insert({
                            message_id: messageId,
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
                                message_id: messageId,
                                image_url: product.imageUrl,
                                alt_text: product.imageAlt || product.title || 'Product image'
                            })
                        );
                    }
                }
            }
            
            // Handle media recommendations with images
            else if (tool.toolName === 'generateMediaRecommendations' && tool.result) {
                const recommendations = Array.isArray(tool.result) ? tool.result : [tool.result];
                
                for (const recommendation of recommendations) {
                    if (recommendation.imageUrl && !processedImageUrls.has(recommendation.imageUrl)) {
                        processedImageUrls.add(recommendation.imageUrl);
                        imagePromises.push(
                            supabase.from('message_images').insert({
                                message_id: messageId,
                                image_url: recommendation.imageUrl,
                                alt_text: recommendation.title || 'Media recommendation'
                            })
                        );
                    }
                }
            }
        }
        
        // Execute all image insertions in parallel
        if (imagePromises.length > 0) {
            const results = await Promise.allSettled(imagePromises);
            
            // Log any errors
            results.forEach((result, index) => {
                if (result.status === 'rejected') {
                    console.error(`Failed to save image ${index}:`, result.reason);
                }
            });
            
        }
    } catch (error) {
        // Handle silently
    }
}