import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, TextInput, StyleSheet, ScrollView, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Начальный список блюд (только если нет сохранённых данных)
const initialDishes = [
  { name: "Оливье", difficulties: [4, 5] },
  { name: "Борщ", difficulties: [4, 5] },
  { name: "Гречка по купечески", difficulties: [3, 4] },
  { name: "Картошка пюре с котлетами", difficulties: [3, 4] },
  { name: "Омлет", difficulties: [1, 2] },
  { name: "Бутерброд", difficulties: [1] }
];

// Ключ для сохранения в AsyncStorage
const STORAGE_KEY = '@dinner_chooser_dishes';

export default function App() {
  const [mood, setMood] = useState(null);
  const [selectedDish, setSelectedDish] = useState(null);
  const [dishes, setDishes] = useState([]);
  const [newDishName, setNewDishName] = useState('');
  const [selectedDifficulties, setSelectedDifficulties] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showDishesList, setShowDishesList] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Загрузка данных при запуске приложения
  useEffect(() => {
    loadDishes();
  }, []);

  // Сохранение данных при изменении списка блюд
  useEffect(() => {
    if (!isLoading) {
      saveDishes();
    }
  }, [dishes, isLoading]);

  // Загрузка блюд из хранилища
  const loadDishes = async () => {
    try {
      const savedDishes = await AsyncStorage.getItem(STORAGE_KEY);
      if (savedDishes !== null) {
        setDishes(JSON.parse(savedDishes));
      } else {
        setDishes(initialDishes);
      }
    } catch (error) {
      Alert.alert('Ошибка', 'Не удалось загрузить список блюд');
      setDishes(initialDishes);
    } finally {
      setIsLoading(false);
    }
  };

  // Сохранение блюд в хранилище
  const saveDishes = async () => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(dishes));
    } catch (error) {
      Alert.alert('Ошибка', 'Не удалось сохранить список блюд');
    }
  };

  // Сброс к начальному списку
  const resetToDefault = () => {
    Alert.alert(
      'Сброс списка',
      'Вернуть начальный список блюд? Текущие изменения будут потеряны.',
      [
        { text: 'Отмена', style: 'cancel' },
        { 
          text: 'Сбросить', 
          style: 'destructive',
          onPress: () => setDishes(initialDishes)
        }
      ]
    );
  };

  // Переключение выбора сложности
  const toggleDifficulty = (difficulty) => {
    setSelectedDifficulties(prev => 
      prev.includes(difficulty) 
        ? prev.filter(d => d !== difficulty)
        : [...prev, difficulty]
    );
  };

  // Улучшенная функция выбора блюда с каскадной вероятностью для 5 категорий
  const chooseDinner = () => {
    if (!mood) return;

    let availableDishes = [];
    const random = Math.random();
    
    // Логика выбора блюд в зависимости от настроения
    if (mood === 1) {
      // Настроение 1: 90% сложность 1, 10% сложность 2
      if (random < 0.9) {
        availableDishes = dishes.filter(dish => dish.difficulties.includes(1));
      } else {
        availableDishes = dishes.filter(dish => dish.difficulties.includes(2));
      }
    } else if (mood === 2) {
      // Настроение 2: 80% сложность 2, 20% сложность 1 или 3
      if (random < 0.8) {
        availableDishes = dishes.filter(dish => dish.difficulties.includes(2));
      } else if (random < 0.9) {
        availableDishes = dishes.filter(dish => dish.difficulties.includes(1));
      } else {
        availableDishes = dishes.filter(dish => dish.difficulties.includes(3));
      }
    } else if (mood === 3) {
      // Настроение 3: 70% сложность 3, 20% сложность 2, 10% сложность 4
      if (random < 0.7) {
        availableDishes = dishes.filter(dish => dish.difficulties.includes(3));
      } else if (random < 0.9) {
        availableDishes = dishes.filter(dish => dish.difficulties.includes(2));
      } else {
        availableDishes = dishes.filter(dish => dish.difficulties.includes(4));
      }
    } else if (mood === 4) {
      // Настроение 4: 70% сложность 4, 20% сложность 3, 10% сложность 5
      if (random < 0.7) {
        availableDishes = dishes.filter(dish => dish.difficulties.includes(4));
      } else if (random < 0.9) {
        availableDishes = dishes.filter(dish => dish.difficulties.includes(3));
      } else {
        availableDishes = dishes.filter(dish => dish.difficulties.includes(5));
      }
    } else if (mood === 5) {
      // Настроение 5: 80% сложность 5, 20% сложность 4
      if (random < 0.8) {
        availableDishes = dishes.filter(dish => dish.difficulties.includes(5));
      } else {
        availableDishes = dishes.filter(dish => dish.difficulties.includes(4));
      }
    }

    // Резервные варианты если нет блюд для выбранной сложности
    if (availableDishes.length === 0) {
      availableDishes = dishes.filter(dish => dish.difficulties.some(d => d <= mood));
    }

    if (availableDishes.length === 0) {
      availableDishes = dishes;
    }

    if (availableDishes.length > 0) {
      const randomIndex = Math.floor(Math.random() * availableDishes.length);
      setSelectedDish(availableDishes[randomIndex]);
    } else {
      Alert.alert('Нет блюд', 'Добавьте блюда в список');
    }
  };

  const addDish = () => {
    if (!newDishName.trim()) {
      Alert.alert('Ошибка', 'Введите название блюда');
      return;
    }

    if (selectedDifficulties.length === 0) {
      Alert.alert('Ошибка', 'Выберите хотя бы одну категорию сложности');
      return;
    }

    // Проверяем, нет ли уже такого блюда
    const dishExists = dishes.some(dish => 
      dish.name.toLowerCase() === newDishName.trim().toLowerCase()
    );

    if (dishExists) {
      Alert.alert('Ошибка', 'Такое блюдо уже есть в списке');
      return;
    }

    const newDish = {
      name: newDishName.trim(),
      difficulties: [...selectedDifficulties].sort()
    };

    setDishes([...dishes, newDish]);
    setNewDishName('');
    setSelectedDifficulties([]);
    setShowAddForm(false);
  };

  const removeDish = (index) => {
    Alert.alert(
      'Удалить блюдо',
      `Вы уверены, что хотите удалить "${dishes[index].name}"?`,
      [
        { text: 'Отмена', style: 'cancel' },
        { 
          text: 'Удалить', 
          style: 'destructive',
          onPress: () => {
            const newDishes = dishes.filter((_, i) => i !== index);
            setDishes(newDishes);
          }
        }
      ]
    );
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <Text>Загрузка...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🍽️ Выбор ужина</Text>
      
      {/* Выбор настроения */}
      <Text style={styles.subtitle}>Настроение готовки:</Text>
      <View style={styles.moodButtons}>
        {[1, 2, 3, 4, 5].map(num => (
          <TouchableOpacity
            key={num}
            style={[styles.moodButton, mood === num && styles.selectedMood]}
            onPress={() => setMood(num)}
          >
            <Text style={styles.moodText}>{num}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Кнопка выбора ужина */}
      <TouchableOpacity
        style={[styles.chooseButton, !mood && styles.disabledButton]}
        onPress={chooseDinner}
        disabled={!mood}
      >
        <Text style={styles.chooseText}>ВЫБРАТЬ УЖИН</Text>
      </TouchableOpacity>

      {/* Результат */}
      {selectedDish && (
        <View style={styles.result}>
          <Text style={styles.resultTitle}>Сегодня готовим:</Text>
          <Text style={styles.dishName}>🍽️ {selectedDish.name}</Text>
          <Text style={styles.difficulty}>
            Категории: {selectedDish.difficulties.join(', ')}
          </Text>
        </View>
      )}

      {/* Управление списком блюд */}
      <View style={styles.managementSection}>
        <TouchableOpacity 
          style={styles.managementButton}
          onPress={() => setShowAddForm(!showAddForm)}
        >
          <Text style={styles.managementButtonText}>
            {showAddForm ? '✕ Отмена' : '+ Добавить блюдо'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.managementButton}
          onPress={() => setShowDishesList(!showDishesList)}
        >
          <Text style={styles.managementButtonText}>
            {showDishesList ? '▼ Скрыть список' : '► Показать список'} ({dishes.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Кнопка сброса */}
      <TouchableOpacity 
        style={styles.resetButton}
        onPress={resetToDefault}
      >
        <Text style={styles.resetButtonText}>🔄 Сбросить к начальному списку</Text>
      </TouchableOpacity>

      {/* Форма добавления */}
      {showAddForm && (
        <View style={styles.addForm}>
          <TextInput
            style={styles.input}
            placeholder="Название блюда"
            value={newDishName}
            onChangeText={setNewDishName}
          />
          <Text style={styles.difficultyLabel}>Категории сложности:</Text>
          <Text style={styles.difficultyHint}>Можно выбрать несколько</Text>
          <View style={styles.difficultyButtons}>
            {[1, 2, 3, 4, 5].map(num => (
              <TouchableOpacity
                key={num}
                style={[
                  styles.diffButton, 
                  selectedDifficulties.includes(num) && styles.selectedDiff
                ]}
                onPress={() => toggleDifficulty(num)}
              >
                <Text style={styles.diffText}>{num}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <Text style={styles.selectedDifficultiesText}>
            Выбрано: {selectedDifficulties.length > 0 ? selectedDifficulties.join(', ') : 'ничего'}
          </Text>
          <TouchableOpacity 
            style={[styles.confirmAddButton, selectedDifficulties.length === 0 && styles.disabledButton]} 
            onPress={addDish}
            disabled={selectedDifficulties.length === 0}
          >
            <Text style={styles.confirmAddText}>Добавить блюдо</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Выпадающий список блюд */}
      {showDishesList && (
        <View style={styles.dishesSection}>
          <ScrollView style={styles.dishesList}>
            {dishes.map((dish, index) => (
              <View key={index} style={styles.dishItem}>
                <View style={styles.dishInfo}>
                  <Text style={styles.dishNameText}>{dish.name}</Text>
                  <Text style={styles.dishDifficulty}>
                    Категории: {dish.difficulties.join(', ')}
                  </Text>
                </View>
                <TouchableOpacity 
                  style={styles.deleteButton}
                  onPress={() => removeDish(index)}
                >
                  <Text style={styles.deleteText}>🗑️</Text>
                </TouchableOpacity>
              </View>
            ))}
            {dishes.length === 0 && (
              <Text style={styles.emptyText}>Список блюд пуст</Text>
            )}
          </ScrollView>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
  },
  subtitle: {
    fontSize: 18,
    marginBottom: 15,
    fontWeight: '600',
  },
  moodButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  moodButton: {
    width: 45,
    height: 45,
    borderRadius: 22,
    backgroundColor: '#ddd',
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedMood: {
    backgroundColor: '#4CAF50',
  },
  moodText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  chooseButton: {
    backgroundColor: '#2196F3',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 20,
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
  chooseText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  result: {
    padding: 20,
    backgroundColor: 'white',
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  resultTitle: {
    fontSize: 20,
    marginBottom: 10,
    fontWeight: '600',
  },
  dishName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4CAF50',
    textAlign: 'center',
  },
  difficulty: {
    fontSize: 16,
    color: '#666',
    marginTop: 5,
  },
  managementSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  managementButton: {
    flex: 1,
    backgroundColor: '#666',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  managementButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  resetButton: {
    backgroundColor: '#FF9800',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 15,
  },
  resetButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  addForm: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
    fontSize: 16,
  },
  difficultyLabel: {
    fontSize: 16,
    marginBottom: 5,
    fontWeight: '600',
  },
  difficultyHint: {
    fontSize: 14,
    color: '#666',
    marginBottom: 10,
    fontStyle: 'italic',
  },
  difficultyButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 10,
  },
  diffButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#eee',
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedDiff: {
    backgroundColor: '#4CAF50',
  },
  diffText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  selectedDifficultiesText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 15,
    fontStyle: 'italic',
  },
  confirmAddButton: {
    backgroundColor: '#4CAF50',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  confirmAddText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  dishesSection: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  dishesList: {
    maxHeight: 200,
  },
  dishItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  dishInfo: {
    flex: 1,
  },
  dishNameText: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  dishDifficulty: {
    fontSize: 14,
    color: '#666',
  },
  deleteButton: {
    padding: 8,
  },
  deleteText: {
    fontSize: 18,
  },
  emptyText: {
    textAlign: 'center',
    color: '#666',
    fontStyle: 'italic',
    padding: 20,
  },
});
