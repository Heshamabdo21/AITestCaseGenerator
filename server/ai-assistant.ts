import OpenAI from "openai";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = process.env.OPENAI_API_KEY ? new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY 
}) : null;

interface CodeBlock {
  language: string;
  code: string;
  explanation?: string;
}

interface AiResponse {
  response: string;
  codeBlocks?: CodeBlock[];
  suggestions?: string[];
}

export async function generateCodeSuggestion(
  message: string,
  context: string = "",
  previousMessages: any[] = []
): Promise<AiResponse> {
  if (!openai) {
    throw new Error("OpenAI API key not configured");
  }

  try {
    const systemPrompt = `You are an expert code assistant specializing in test case development and automation. 
    You help developers write better test cases, improve code quality, and provide practical coding solutions.
    
    Context: You're working within a test case management system built with React, TypeScript, and Express.js.
    
    Guidelines:
    - Provide concise, actionable code suggestions
    - Include practical examples when helpful
    - Focus on test case development, automation, and quality
    - Use TypeScript/JavaScript for code examples
    - Suggest testing best practices
    - Be encouraging and helpful
    
    Current context: ${context}
    
    When providing code, format it as JSON with this structure:
    {
      "response": "Your helpful explanation",
      "codeBlocks": [
        {
          "language": "typescript",
          "code": "// Your code here",
          "explanation": "Brief explanation of the code"
        }
      ],
      "suggestions": ["Quick suggestion 1", "Quick suggestion 2"]
    }`;

    const messages = [
      { role: "system", content: systemPrompt },
      ...previousMessages.slice(-3).map(msg => ({
        role: msg.type === 'user' ? 'user' : 'assistant',
        content: msg.content
      })),
      { role: "user", content: message }
    ];

    const response = await openai!.chat.completions.create({
      model: "gpt-4o",
      messages: messages as any,
      response_format: { type: "json_object" },
      max_tokens: 1000,
      temperature: 0.7,
    });

    const result = JSON.parse(response.choices[0].message.content || '{}');
    
    return {
      response: result.response || "I'm here to help with your code!",
      codeBlocks: result.codeBlocks || [],
      suggestions: result.suggestions || []
    };

  } catch (error) {
    console.error('OpenAI API error:', error);
    throw new Error("Failed to generate code suggestion");
  }
}

export async function analyzeTestCase(testCaseContent: string): Promise<AiResponse> {
  if (!openai) {
    throw new Error("OpenAI API key not configured");
  }

  try {
    const response = await openai!.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are a test case analysis expert. Analyze the provided test case and suggest improvements.
          
          Respond with JSON in this format:
          {
            "response": "Your analysis and recommendations",
            "codeBlocks": [
              {
                "language": "typescript",
                "code": "// Improved test case code",
                "explanation": "Explanation of improvements"
              }
            ],
            "suggestions": ["Suggestion 1", "Suggestion 2"]
          }`
        },
        {
          role: "user",
          content: `Analyze this test case and suggest improvements:\n\n${testCaseContent}`
        }
      ],
      response_format: { type: "json_object" },
      max_tokens: 1200,
      temperature: 0.6,
    });

    const result = JSON.parse(response.choices[0].message.content || '{}');
    
    return {
      response: result.response || "Test case analysis completed.",
      codeBlocks: result.codeBlocks || [],
      suggestions: result.suggestions || []
    };

  } catch (error) {
    console.error('OpenAI API error:', error);
    throw new Error("Failed to analyze test case");
  }
}