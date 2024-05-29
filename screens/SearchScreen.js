import React, { useState, useEffect } from 'react';
import { View, TextInput, Button, FlatList, Text, TouchableOpacity, StyleSheet } from 'react-native';
import axios from 'axios';
import { Icon } from 'react-native-elements';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Animatable from 'react-native-animatable';

export default function SearchScreen({ navigation }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [favorites, setFavorites] = useState([]);

  useEffect(() => {
    // Function to load favorites from AsyncStorage during the initial screen load
    const loadFavorites = async () => {
      const storedFavorites = await AsyncStorage.getItem('favorites');
      if (storedFavorites) {
        setFavorites(JSON.parse(storedFavorites));
      }
    };
    loadFavorites();
  }, []);

  const search = async () => {
    try {
      // Performs an HTTP GET request to the iTunes API to search for artists or tracks based on the user's query
      const response = await axios.get(`https://itunes.apple.com/search?term=${query}`);
      setResults(response.data.results);
    } catch (error) {
      console.error(error);
    }
  };

  const toggleFavorite = async (item) => {
    let updatedFavorites;
    if (favorites.some(favorite => favorite.trackId === item.trackId)) {
      // If the item is already in favorites, remove it from the favorites list
      updatedFavorites = favorites.filter(favorite => favorite.trackId !== item.trackId);
    } else {
      // Otherwise, add the item to the favorites list
      updatedFavorites = [...favorites, item];
    }
    setFavorites(updatedFavorites);
    // Save the updated favorites to AsyncStorage
    await AsyncStorage.setItem('favorites', JSON.stringify(updatedFavorites));
  };

  const navigateToLadder = () => {
    // Navigate to the "Ladder" screen
    navigation.navigate('Ladder');
  };

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        placeholder="Search for an artist or track"
        value={query}
        onChangeText={setQuery}
      />
      <View style={styles.buttonContainer}>
        <Button title="Search" onPress={search} />
      </View>
      <View style={styles.buttonContainer}>
        <Button title="View Favorites" onPress={() => navigation.navigate('Favorites')} />
      </View>
      <View style={styles.buttonContainer}>
        <Button title="Ladder Song" onPress={navigateToLadder} />
      </View>
      <FlatList
        data={results}
        keyExtractor={(item) => item.trackId.toString()}
        renderItem={({ item }) => {
          const isFavorite = favorites.some(favorite => favorite.trackId === item.trackId);
          return (
            <Animatable.View animation="fadeIn" duration={800} style={styles.itemContainer}>
              <TouchableOpacity onPress={() => navigation.navigate('Detail', { item })} style={styles.itemTextContainer}>
                <Text style={styles.itemText}>{item.trackName} by {item.artistName}</Text>
              </TouchableOpacity>
              <Icon
                name={isFavorite ? 'heart' : 'heart-o'}
                type="font-awesome"
                color={isFavorite ? '#f50' : '#ccc'}
                onPress={() => toggleFavorite(item)}
                style={styles.icon}
              />
            </Animatable.View>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  input: {
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    marginBottom: 20,
    paddingLeft: 10,
  },
  itemContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 10,
    padding: 10,
    backgroundColor: '#f9f9f9',
    borderRadius: 10,
    elevation: 2,
  },
  itemTextContainer: {
    flex: 1,
    paddingRight: 10,
  },
  itemText: {
    fontSize: 18,
  },
  icon: {
    padding: 10,
  },
  buttonContainer: {
    marginBottom: 20,
  },
});
