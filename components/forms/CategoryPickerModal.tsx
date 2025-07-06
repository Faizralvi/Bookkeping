import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

export interface Category {
  label: string;
  value: string;
}

interface Props {
  visible: boolean;
  onClose: () => void;
  selectedValue: string;
  onSelect: (value: string) => void;
  categories: Category[];
  title?: string;
  themeColor?: string;
}

const CategoryPickerModal: React.FC<Props> = ({
  visible,
  onClose,
  selectedValue,
  onSelect,
  categories,
  title = 'Pilih Kategori',
  themeColor = '#ef4444', // default merah
}) => {
  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: themeColor }]}>{title}</Text>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={24} color={themeColor} />
          </TouchableOpacity>
        </View>

        <ScrollView showsVerticalScrollIndicator={false}>
          {categories.map((c) => {
            const isSelected = selectedValue === c.value;
            return (
              <TouchableOpacity
                key={c.value}
                onPress={() => {
                  onSelect(c.value);
                  onClose();
                }}
                style={[
                  styles.item,
                  {
                    borderColor: isSelected ? themeColor : '#e5e7eb',
                    backgroundColor: isSelected ? '#fef2f2' : '#f9fafb',
                  },
                ]}
              >
                <Text
                  style={{
                    fontSize: 16,
                    color: isSelected ? themeColor : '#374151',
                    fontWeight: isSelected ? '600' : '400',
                  }}
                >
                  {c.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingTop: 24,
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  item: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
});

export default CategoryPickerModal;
