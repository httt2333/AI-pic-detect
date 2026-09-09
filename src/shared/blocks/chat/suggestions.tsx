import {
  Suggestion,
  Suggestions,
} from '@/shared/components/ai-elements/suggestion';
import { useChatContext } from '@/shared/contexts/chat';

export function ChatSuggestions() {
  const suggestions = [
    'What are the latest trends in AI?',
    'How does machine learning work?',
    'Explain quantum computing',
    'Best practices for React development',
    'Tell me about TypeScript benefits',
    'How to optimize database queries?',
    'What is the difference between SQL and NoSQL?',
    'Explain cloud computing basics',
  ];

  const handleSuggestionClick = (suggestion: string) => {
    // setStatus('submitted');
    // addUserMessage(suggestion);
  };

  return (
    <Suggestions className="px-4">
      {suggestions.map((suggestion) => (
        <Suggestion
          key={suggestion}
          onClick={() => handleSuggestionClick(suggestion)}
          suggestion={suggestion}
        />
      ))}
    </Suggestions>
  );
}
