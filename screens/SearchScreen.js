import React, { useState, useEffect } from 'react';
import { View, TextInput, FlatList, Text, TouchableOpacity, StyleSheet } from 'react-native';
import axios from 'axios';
import { Icon } from 'react-native-elements';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Animatable from 'react-native-animatable';

export default function SearchScreen({ navigation }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [favorites, setFavorites] = useState([]);

  useEffect(() => {
    const loadFavorites = async () => {
      const storedFavorites = await AsyncStorage.getItem('favorites');
      if (storedFavorites) {
        setFavorites(JSON.parse(storedFavorites));
      }
    };
    loadFavorites();
  }, []);

  useEffect(() => {
    const fetchResults = async () => {
      if (query.trim() !== '') {
        try {
          const response = await axios.get(`https://itunes.apple.com/search?term=${query}`);
          setResults(response.data.results);
        } catch (error) {
          console.error(error);
        }
      } else {
        setResults([]);
      }
    };

    const debounceFetch = setTimeout(fetchResults, 300);

    return () => clearTimeout(debounceFetch);
  }, [query]);

  const toggleFavorite = async (item) => {
    let updatedFavorites;
    if (favorites.some(favorite => favorite.trackId === item.trackId)) {
      updatedFavorites = favorites.filter(favorite => favorite.trackId !== item.trackId);
    } else {
      updatedFavorites = [...favorites, item];
    }
    setFavorites(updatedFavorites);
    await AsyncStorage.setItem('favorites', JSON.stringify(updatedFavorites));
  };

  const navigateToLadder = () => {
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
        <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('Favorites')}>
          <Text style={styles.buttonText}>View Favorites</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.button} onPress={navigateToLadder}>
          <Text style={styles.buttonText}>Ladder Song</Text>
        </TouchableOpacity>
      </View>
      <FlatList
        data={results}
        keyExtractor={(item) => (item.trackId ? item.trackId.toString() : item.collectionId.toString())}
        renderItem={({ item }) => {
          const isFavorite = favorites.some(favorite => favorite.trackId === item.trackId);
          return (
            <Animatable.View animation="fadeIn" duration={800} style={styles.itemContainer}>
              <TouchableOpacity onPress={() => navigation.navigate('Detail', { item })} style={styles.itemTextContainer}>
                <Text style={styles.itemText}>{item.trackName ? `${item.trackName} by ${item.artistName}` : item.collectionName}</Text>
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
    borderRadius: 5,
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
  button: {
    backgroundColor: '#6200EE',
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
  },
});
