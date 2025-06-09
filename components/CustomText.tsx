import { useState } from 'react';
import { Text, TextInput, TextProps, View } from 'react-native';

export function CustomText(props: TextProps) {
  const { style, ...rest } = props;
  const [searchQuery, setSearchQuery] = useState('');
  const [type, setType] = useState('');

  const renderSearchBar = () => {
    if (type !== 'asset' && type !== 'liability' && type !== 'equity') return null;
    return (
      <View className="mb-4">
        <TextInput
          className="bg-white border border-gray-300 rounded-lg px-4 py-2"
          placeholder="Cari nama atau deskripsi..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>
    );
  };

  return (
    <Text
      style={[
        { fontFamily: 'Poppins-Regular' },
        style,
      ]}
      {...rest}
    />
  );
} 