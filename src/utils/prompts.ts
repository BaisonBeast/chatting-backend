export const generateNextWordPrompt = (textContent: string) => {
    return `Based on the given input ${textContent}, predict the next word the user is likely to type. Provide exactly 5 possible word suggestions in a comma-separated format.

Format:
Suggestion1, Suggestion2, Suggestion3, Suggestion4, Suggestion5

Ensure the suggestions are contextually relevant and likely to follow naturally. Do not include explanations or the user's input—only the five words.`;
};

export const generateReplySuggestionPrompt = (textContent: string) => {
    return `You are building a chat application and want to provide 5 short, concise reply suggestions based on the user's input. The user has typed the following text: "${textContent}". Provide 5 brief and relevant reply suggestions in the following format:

Reply 1, Reply 2, Reply 3, Reply 4, Reply 5

Ensure that the replies are short and to the point. Do not include any other text or explanation, just the comma-separated suggestions.`;
};
