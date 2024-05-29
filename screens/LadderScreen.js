import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const LadderScreen = ({ route, navigation }) => {
  const [songList, setSongList] = useState([]);

  useEffect(() => {
    // Fonction pour récupérer la liste des chansons
    const fetchSongList = async () => {
      let storedSongList = [];

      if (route.params && route.params.songList) {
        // Si la liste des chansons est passée en paramètre, l'utiliser
        storedSongList = route.params.songList;
      } else {
        // Sinon, récupérer la liste des chansons depuis AsyncStorage
        storedSongList = JSON.parse(await AsyncStorage.getItem('songList')) || [];
      }

      // Mettre à jour la liste des chansons
      setSongList(storedSongList);
    };

    // Appeler la fonction pour récupérer la liste des chansons
    fetchSongList();
  }, [route.params]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Ladder Song</Text>
      {songList.length > 0 ? (
        <FlatList
          data={songList}
          keyExtractor={(item) => item.trackId.toString()}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.songItem}
              onPress={() => navigation.navigate('Detail', { item })}
            >
              <Text style={styles.songName}>{item.trackName}</Text>
              <Text style={styles.songRating}>{item.rating.toFixed(1)}</Text>
            </TouchableOpacity>
          )}
        />
      ) : (
        <Text>Aucune chanson n'a reçu de notation pour le moment.</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  songItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  songName: {
    fontSize: 18,
  },
  songRating: {
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default LadderScreen;
