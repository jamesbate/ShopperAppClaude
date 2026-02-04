import React, { useState, useCallback } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  Text,
  StyleSheet,
  FlatList,
  Keyboard,
} from 'react-native';

interface AddItemInputProps {
  onAddItem: (name: string, quantity?: number) => void;
  getSuggestions: (query: string) => string[];
}

export function AddItemInput({ onAddItem, getSuggestions }: AddItemInputProps) {
  const [text, setText] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const handleTextChange = useCallback((value: string) => {
    setText(value);
    if (value.trim().length > 0) {
      const matches = getSuggestions(value);
      setSuggestions(matches);
      setShowSuggestions(matches.length > 0);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, [getSuggestions]);

  const handleSubmit = useCallback(() => {
    const trimmed = text.trim();
    if (trimmed) {
      // Parse quantity if present (e.g., "2 milk" or "milk x3")
      const quantityMatch = trimmed.match(/^(\d+)\s+(.+)$/) || trimmed.match(/^(.+)\s+x(\d+)$/i);
      if (quantityMatch) {
        const isFirstPattern = /^\d+/.test(trimmed);
        const quantity = parseInt(isFirstPattern ? quantityMatch[1] : quantityMatch[2], 10);
        const name = isFirstPattern ? quantityMatch[2] : quantityMatch[1];
        onAddItem(name, quantity);
      } else {
        onAddItem(trimmed);
      }
      setText('');
      setSuggestions([]);
      setShowSuggestions(false);
      Keyboard.dismiss();
    }
  }, [text, onAddItem]);

  const handleSuggestionPress = useCallback((suggestion: string) => {
    setText(suggestion);
    setSuggestions([]);
    setShowSuggestions(false);
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          value={text}
          onChangeText={handleTextChange}
          placeholder="Add item (e.g., '2 milk' or 'bread')"
          placeholderTextColor="#999"
          returnKeyType="done"
          onSubmitEditing={handleSubmit}
          onFocus={() => {
            if (suggestions.length > 0) setShowSuggestions(true);
          }}
          onBlur={() => {
            // Delay to allow suggestion press
            setTimeout(() => setShowSuggestions(false), 200);
          }}
        />
        <TouchableOpacity
          style={[styles.addButton, !text.trim() && styles.addButtonDisabled]}
          onPress={handleSubmit}
          disabled={!text.trim()}
        >
          <Text style={styles.addButtonText}>+</Text>
        </TouchableOpacity>
      </View>
      
      {showSuggestions && suggestions.length > 0 && (
        <View style={styles.suggestionsContainer}>
          <FlatList
            data={suggestions}
            keyExtractor={(item, index) => `${item}-${index}`}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.suggestionItem}
                onPress={() => handleSuggestionPress(item)}
              >
                <Text style={styles.suggestionText}>{item}</Text>
              </TouchableOpacity>
            )}
            keyboardShouldPersistTaps="handled"
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 12,
    alignItems: 'center',
  },
  input: {
    flex: 1,
    height: 48,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 24,
    paddingHorizontal: 16,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
  },
  addButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  addButtonDisabled: {
    backgroundColor: '#ccc',
  },
  addButtonText: {
    color: '#fff',
    fontSize: 28,
    fontWeight: '300',
    lineHeight: 30,
  },
  suggestionsContainer: {
    maxHeight: 200,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  suggestionItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  suggestionText: {
    fontSize: 16,
    color: '#333',
  },
});
