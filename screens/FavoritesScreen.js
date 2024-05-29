import React, { useState, useEffect } from 'react';
import { View, FlatList, Text, TouchableOpacity, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Icon } from 'react-native-elements';
import * as Animatable from 'react-native-animatable';

export default function FavoritesScreen({ navigation }) {
  const [favorites, setFavorites] = useState([]);

  useEffect(() => {
    // Fonction pour charger les favoris depuis AsyncStorage
    const loadFavorites = async () => {
      const storedFavorites = await AsyncStorage.getItem('favorites');
      if (storedFavorites) {
        setFavorites(JSON.parse(storedFavorites));
      }
    };
    loadFavorites();
  }, []);

  const removeFavorite = async (trackId) => {
    // Filtrer les favoris pour supprimer l'élément avec le trackId donné
    const updatedFavorites = favorites.filter(item => item.trackId !== trackId);
    setFavorites(updatedFavorites);
    // Enregistrer les favoris mis à jour dans AsyncStorage
    await AsyncStorage.setItem('favorites', JSON.stringify(updatedFavorites));
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={favorites}
        keyExtractor={(item) => item.trackId.toString()}
        renderItem={({ item }) => (
          <Animatable.View animation="fadeIn" duration={800} style={styles.itemContainer}>
            <TouchableOpacity onPress={() => navigation.navigate('Detail', { item })} style={styles.itemTextContainer}>
              <Text style={styles.itemText}>{item.trackName} by {item.artistName}</Text>
            </TouchableOpacity>
            <Icon
              name="heart"
              type="font-awesome"
              color="#f50"
              onPress={() => removeFavorite(item.trackId)}
              style={styles.icon}
            />
          </Animatable.View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
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
});
