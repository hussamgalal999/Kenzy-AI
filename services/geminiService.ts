import { GoogleGenAI, GenerateContentResponse, Modality, Type, Chat, GenerateImagesResponse, VideosOperation } from "@google/genai";
import { AspectRatio, Page, Quiz } from "../types";

export type StoryPage = {
  text: string;
  imagePrompt: string;
};

export type StoryData = {
  title: string;
  pages: StoryPage[];
};


class GeminiService {
  private getAi(): GoogleGenAI {
    const apiKey = process.env.API_KEY;
    if (!apiKey) {
      // In a production app, you might want to disable features or show a message.
      // For this sample, we throw an error to make configuration issues obvious.
      throw new Error("API_KEY environment variable not set.");
    }
    return new GoogleGenAI({ apiKey });
  }

  private handleApiError(error: any, context: string, primaryError?: any) {
    console.error(`Error in ${context}:`, error);
    
    const isPrimaryQuotaError = primaryError?.message?.includes("RESOURCE_EXHAUSTED");
    const isFallbackConfigError = error.message?.includes("PlayHT User ID not set");

    if (isPrimaryQuotaError && isFallbackConfigError) {
        alert("The primary audio service is over its quota, and the fallback service is not configured correctly. Please ensure the 'PLAYHT_USER_ID' environment variable is set to restore audio functionality.");
    } else if (isFallbackConfigError) {
        alert("The fallback audio provider is not configured. Please set the 'PLAYHT_USER_ID' environment variable to enable this feature.");
    } else if (error.message?.includes("api key not valid") || error.message?.includes("permission_denied")) {
        alert("The configured API key is invalid or lacks permissions. Please check your Google AI Studio settings.");
    } else if (error.message?.includes("RESOURCE_EXHAUSTED")) {
        alert("You have exceeded your API quota. Please check your plan and billing details on the Google AI Studio website to continue using this feature.");
    }
  }


  async generateStoryPages(prompt: string, numPages: number, storyLength: 'short' | 'medium' | 'long'): Promise<StoryData> {
    try {
        const ai = this.getAi();
        const response = await ai.models.generateContent({
           model: "gemini-2.5-pro",
           contents: `Create a children's story that is ${numPages} pages long, based on this idea: "${prompt}". The story should have a clear beginning, middle, and end. For each page, provide the story text and a simple, descriptive prompt for an illustration in a cute, storybook style.`,
           config: {
             responseMimeType: "application/json",
             responseSchema: {
                type: Type.OBJECT,
                properties: {
                  title: {
                    type: Type.STRING,
                    description: 'A creative title for the story.'
                  },
                  pages: {
                    type: Type.ARRAY,
                    description: `An array of ${numPages} pages for the story.`,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        text: {
                          type: Type.STRING,
                          description: `The text for this page of the story (${{short: "1-2 sentences", medium: "2-4 sentences", long: "4-6 sentences"}[storyLength]}).`
                        },
                        imagePrompt: {
                          type: Type.STRING,
                          description: 'A simple prompt to generate an illustration for this page. Style: "A cute, vibrant illustration".'
                        }
                      }
                    }
                  }
                }
              },
           },
        });
      
        const jsonStr = response.text.trim();
        const data = JSON.parse(jsonStr);
        if (data && typeof data.title === 'string' && Array.isArray(data.pages)) {
            const isValidPages = data.pages.every((p: any) => p && typeof p.text === 'string' && typeof p.imagePrompt === 'string');
            if (isValidPages) {
                return data as StoryData;
            }
        }
        console.error("Invalid story data structure received from API:", data);
        throw new Error("Received invalid story data structure from the API.");
    } catch (e) {
        console.error("Failed to parse story data JSON from API. Raw response:", e);
        this.handleApiError(e, 'generateStoryPages');
        throw new Error("The AI failed to generate a valid story structure. Please try a different prompt.");
    }
  }

  async generateStoryImage(prompt: string): Promise<string> {
    try {
        const ai = this.getAi();
        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash-image',
          contents: {
            parts: [{ text: prompt }],
          },
          config: {
              responseModalities: [Modality.IMAGE],
          },
        });

        for (const part of response.candidates[0].content.parts) {
          if (part.inlineData) {
            return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
          }
        }
        throw new Error("No image generated from prompt.");
    } catch (error) {
        this.handleApiError(error, 'generateStoryImage');
        throw error;
    }
  }

  async analyzeSentiment(text: string): Promise<string> {
    try {
        const ai = this.getAi();
        const response = await ai.models.generateContent({
          model: "gemini-2.5-flash",
          contents: `Analyze the following text and describe the primary emotion or tone in a single word (e.g., "formal", "inspirational", "urgent", "somber", "objective", "enthusiastic"). Text: "${text}"`,
        });
        return response.text.trim().replace(/[^a-zA-Z]/g, '').toLowerCase();
    } catch (error) {
        this.handleApiError(error, 'analyzeSentiment');
        throw error;
    }
  }

  private async generateSpeechWithGemini(prompt: string): Promise<string> {
    const ai = this.getAi();
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: prompt }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: 'Kore' },
            },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (base64Audio) {
      return base64Audio;
    }
    throw new Error("Gemini speech generation failed.");
  }

  private async generateSpeechWithPlayHT(text: string): Promise<string> {
    const PLAYHT_API_KEY = "APS-e37aQV5Unhvr2htb9lh5bKHHqNGCJEcU";
    const PLAYHT_USER_ID = process.env.PLAYHT_USER_ID;

    if (!PLAYHT_USER_ID) {
        console.warn("PlayHT User ID is not set. This provider will be skipped. Please set the PLAYHT_USER_ID environment variable.");
        throw new Error("PlayHT User ID not set.");
    }

    const response = await fetch('https://api.play.ht/api/v2/tts', {
        method: 'POST',
        headers: {
            'AUTHORIZATION': `Bearer ${PLAYHT_API_KEY}`,
            'X-USER-ID': PLAYHT_USER_ID,
            'Accept': 'audio/l16',
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            text: text,
            voice: 's3://voice-cloning-zero-shot/d9ff78ba-d016-47f6-b046-52ea074013ab/female-cs/manifest.json',
            output_format: 'raw',
            sample_rate: 24000,
            voice_engine: "PlayHT2.0-turbo"
        }),
    });

    if (!response.ok) {
        const errorBody = await response.text();
        console.error("PlayHT API error response:", errorBody);
        throw new Error(`PlayHT API request failed with status ${response.status}: ${errorBody}`);
    }

    const audioArrayBuffer = await response.arrayBuffer();
    const audioBytes = new Uint8Array(audioArrayBuffer);
    
    let binary = '';
    for (let i = 0; i < audioBytes.byteLength; i++) {
        binary += String.fromCharCode(audioBytes[i]);
    }
    return btoa(binary);
  }

  async generateExpressiveSpeech(text: string): Promise<string> {
    const geminiPrompt = `Read the following text in a gentle and engaging voice suitable for a children's story: "${text}"`;
    
    try {
        return await this.generateSpeechWithGemini(geminiPrompt);
    } catch (geminiError) {
        console.warn("Gemini TTS failed, falling back to PlayHT.", geminiError);
        try {
            return await this.generateSpeechWithPlayHT(text);
        } catch (playHTError) {
            console.error("PlayHT TTS also failed.", playHTError);
            this.handleApiError(playHTError, 'All TTS providers', geminiError);
            throw new Error("All TTS providers failed to generate speech.");
        }
    }
  }

  async generateImage(prompt: string, aspectRatio: AspectRatio): Promise<string[]> {
    try {
        const ai = this.getAi();
        const response = await ai.models.generateImages({
          model: 'imagen-4.0-generate-001',
          prompt: prompt,
          config: {
            numberOfImages: 1,
            aspectRatio: aspectRatio,
            outputMimeType: 'image/jpeg',
          },
        });

        return response.generatedImages.map(img => `data:image/jpeg;base64,${img.image.imageBytes}`);
    } catch (error) {
        this.handleApiError(error, 'generateImage');
        throw error;
    }
  }

  async editImage(prompt: string, imageData: { data: string; mimeType: string }): Promise<string> {
    try {
        const ai = this.getAi();
        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash-image',
          contents: {
            parts: [
              {
                inlineData: {
                  data: imageData.data,
                  mimeType: imageData.mimeType,
                },
              },
              { text: prompt },
            ],
          },
          config: {
            responseModalities: [Modality.IMAGE],
          },
        });

        for (const part of response.candidates[0].content.parts) {
          if (part.inlineData) {
            return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
          }
        }
        throw new Error("No edited image generated.");
    } catch (error) {
        this.handleApiError(error, 'editImage');
        throw error;
    }
  }

  async analyzeImage(prompt: string, imageData: { data: string; mimeType: string }): Promise<string> {
    try {
        const ai = this.getAi();
        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: {
            parts: [
              {
                inlineData: {
                  data: imageData.data,
                  mimeType: imageData.mimeType,
                },
              },
              { text: prompt },
            ],
          },
        });

        return response.text;
    } catch (error) {
        this.handleApiError(error, 'analyzeImage');
        throw error;
    }
  }

  async generateVideo(prompt: string, imagePayload?: {data: string, mimeType: string}): Promise<string> {
    try {
        const ai = this.getAi();
        let operation = await ai.models.generateVideos({
          model: 'veo-3.1-fast-generate-preview',
          prompt: prompt,
          image: imagePayload ? { imageBytes: imagePayload.data, mimeType: imagePayload.mimeType } : undefined,
          config: {
            numberOfVideos: 1,
            resolution: '720p',
            aspectRatio: '16:9'
          }
        });
        
        while (!operation.done) {
          await new Promise(resolve => setTimeout(resolve, 10000));
          operation = await ai.operations.getVideosOperation({operation: operation});
        }

        if (operation.response?.generatedVideos?.[0]?.video?.uri) {
          const downloadLink = operation.response.generatedVideos[0].video.uri;
          const response = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);
          const videoBlob = await response.blob();
          return URL.createObjectURL(videoBlob);
        }
        
        throw new Error("Video generation failed or returned no URI.");
    } catch (error) {
        this.handleApiError(error, 'generateVideo');
        throw error;
    }
  }

  async createChat(systemInstruction: string): Promise<Chat> {
    const ai = this.getAi();
    return ai.chats.create({
      model: 'gemini-2.5-flash',
      config: {
        systemInstruction: systemInstruction,
      },
    });
  }

  async generateSpeech(text: string): Promise<string> {
    try {
        return await this.generateSpeechWithGemini(text);
    } catch (geminiError) {
        console.warn("Gemini TTS failed, falling back to PlayHT.", geminiError);
        try {
            return await this.generateSpeechWithPlayHT(text);
        } catch (playHTError) {
            console.error("PlayHT TTS also failed.", playHTError);
            this.handleApiError(playHTError, 'All TTS providers', geminiError);
            throw new Error("All TTS providers failed to generate speech.");
        }
    }
  }

  async groundedSearch(prompt: string): Promise<{ text: string; sources: any[] }> {
    try {
        const ai = this.getAi();
        const response = await ai.models.generateContent({
          model: "gemini-2.5-flash",
          contents: prompt,
          config: {
            tools: [{googleSearch: {}}],
          },
        });
        const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
        return { text: response.text, sources: sources };
    } catch (error) {
        this.handleApiError(error, 'groundedSearch');
        throw error;
    }
  }

  async groundedMapsSearch(prompt: string, lat: number, lng: number): Promise<{ text: string; sources: any[] }> {
    try {
        const ai = this.getAi();
        const response = await ai.models.generateContent({
          model: "gemini-2.5-flash",
          contents: prompt,
          config: {
            tools: [{googleMaps: {}}],
            toolConfig: {
              retrievalConfig: {
                latLng: {
                  latitude: lat,
                  longitude: lng
                }
              }
            }
          },
        });
        const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
        return { text: response.text, sources: sources };
    } catch (error) {
        this.handleApiError(error, 'groundedMapsSearch');
        throw error;
    }
  }
  
  async generateTextWithThinking(prompt: string): Promise<string> {
    try {
        const ai = this.getAi();
        const response = await ai.models.generateContent({
          model: "gemini-2.5-pro",
          contents: prompt,
          config: {
            thinkingConfig: { thinkingBudget: 32768 }
          },
        });
        return response.text;
    } catch (error) {
        this.handleApiError(error, 'generateTextWithThinking');
        throw error;
    }
  }

  async generateSearchSuggestions(context: string, items: string[]): Promise<string[]> {
    try {
      const ai = this.getAi();
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: `Based on the following list of items available on a "${context}" page, generate 3-4 concise and relevant search suggestions a user might type to find one of these items. Items: ${items.join(', ')}.`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              suggestions: {
                type: Type.ARRAY,
                description: "An array of 3-4 short search suggestions.",
                items: {
                  type: Type.STRING
                }
              }
            },
            required: ["suggestions"]
          },
        },
      });

      const jsonStr = response.text.trim();
      const data = JSON.parse(jsonStr);

      if (data && Array.isArray(data.suggestions)) {
        return data.suggestions as string[];
      }
      
      return [];

    } catch (error) {
      console.error(`Error generating search suggestions for ${context}:`, error);
      return [];
    }
  }

  async summarizePdfText(text: string): Promise<string> {
    try {
        const ai = this.getAi();
        const response = await ai.models.generateContent({
          model: "gemini-2.5-flash",
          contents: `Please provide a concise summary of the following document text:\n\n---\n\n${text}`,
        });
        return response.text;
    } catch (error) {
        this.handleApiError(error, 'summarizePdfText');
        throw error;
    }
  }

  async answerPdfQuestion(context: string, question: string): Promise<string> {
    try {
        const ai = this.getAi();
        const response = await ai.models.generateContent({
          model: "gemini-2.5-flash",
          contents: `Based on the text from the document provided below, please answer the following question. If the answer cannot be found in the text, clearly state that the information is not available in the document.\n\nDOCUMENT TEXT:\n---\n${context}\n---\n\nQUESTION:\n${question}`,
        });
        return response.text;
    } catch (error) {
        this.handleApiError(error, 'answerPdfQuestion');
        throw error;
    }
  }

  async generateQuiz(storyTitle: string, storyPages: Page[]): Promise<Quiz> {
    if (storyPages.map(p => p.text).join('').length < 50) {
        throw new Error("Story is too short to generate a meaningful quiz.");
    }
    
    try {
        const ai = this.getAi();
        const response = await ai.models.generateContent({
            model: "gemini-2.5-pro",
            contents: `Based on the following children's story titled "${storyTitle}", create a comprehensive and integrated comprehension quiz with 3 multiple-choice questions. Each question should have 4 options. One option must be correct. The questions should test different aspects of the story, including character details, plot events, the setting, and the main theme or moral of the story.
            
            STORY:
            ${storyPages.map(p => p.text).join('\n\n')}
            `,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        questions: {
                            type: Type.ARRAY,
                            description: "An array of 3 multiple-choice questions.",
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    question: { type: Type.STRING },
                                    options: {
                                        type: Type.ARRAY,
                                        description: "An array of 4 possible answers.",
                                        items: { type: Type.STRING }
                                    },
                                    correctAnswer: {
                                        type: Type.STRING,
                                        description: "The exact text of the correct answer from the options array."
                                    }
                                },
                                required: ["question", "options", "correctAnswer"]
                            }
                        }
                    },
                    required: ["questions"]
                },
            },
        });

        const jsonStr = response.text.trim();
        const data = JSON.parse(jsonStr);
        if (data && Array.isArray(data.questions) && data.questions.length > 0) {
            return data as Quiz;
        }
        throw new Error("Invalid quiz data structure.");
    } catch (e) {
        console.error("Failed to parse quiz JSON from API. Raw response:", e);
        this.handleApiError(e, 'generateQuiz');
        throw new Error("The AI failed to generate a valid quiz.");
    }
  }
}

export const geminiService = new GeminiService();