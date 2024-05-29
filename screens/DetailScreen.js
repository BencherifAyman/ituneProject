import React, { useState, useEffect, useRef } from 'react';
import { View, Text, Alert, StyleSheet, TouchableOpacity, Button } from 'react-native';
import { Rating, Icon } from 'react-native-elements';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Animatable from 'react-native-animatable';
import { Audio } from 'expo-av';
import Slider from '@react-native-community/slider';

export default function DetailScreen({ route, navigation }) {
  const { item } = route.params;
  const [rating, setRating] = useState(0);
  const [isFavorite, setIsFavorite] = useState(false);
  const [sound, setSound] = useState(null);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const intervalRef = useRef(null);
  const currentSound = useRef(null);

  useEffect(() => {
    // Vérifie si l'élément est déjà dans les favoris lors du chargement de l'écran
    const checkFavorite = async () => {
      const favorites = JSON.parse(await AsyncStorage.getItem('favorites')) || [];
      const favorite = favorites.some(favorite => favorite.trackId === item.trackId);
      setIsFavorite(favorite);
    };
    checkFavorite();
    return () => {
      // Nettoie les ressources lors de la suppression de l'écran
      if (sound) {
        sound.unloadAsync();
      }
      clearInterval(intervalRef.current);
    };
  }, []);

  const addToFavorites = async () => {
    try {
      // Ajoute l'élément aux favoris
      const favorites = JSON.parse(await AsyncStorage.getItem('favorites')) || [];
      if (favorites.some(favorite => favorite.trackId === item.trackId)) {
        Alert.alert('Already in favorites');
        return;
      }
      const updatedFavorites = [...favorites, item];
      await AsyncStorage.setItem('favorites', JSON.stringify(updatedFavorites));
      setIsFavorite(true);
      Alert.alert('Added to favorites');
    } catch (error) {
      console.error(error);
    }
  };

  const removeFromFavorites = async () => {
    try {
      // Supprime l'élément des favoris
      const favorites = JSON.parse(await AsyncStorage.getItem('favorites')) || [];
      const updatedFavorites = favorites.filter(favorite => favorite.trackId !== item.trackId);
      await AsyncStorage.setItem('favorites', JSON.stringify(updatedFavorites));
      setIsFavorite(false);
      Alert.alert('Removed from favorites');
    } catch (error) {
      console.error(error);
    }
  };

  const playSound = async () => {
    try {
      if (currentSound.current) {
        // Reprend la lecture à partir de la position actuelle si le son est déjà chargé
        await currentSound.current.playAsync();
        setIsPlaying(true);
        return;
      }

      // Charge et joue le son à partir de l'URL de prévisualisation
      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: item.previewUrl },
        { shouldPlay: true }
      );

      newSound.setOnPlaybackStatusUpdate(updateSoundStatus);
      currentSound.current = newSound;
      setIsPlaying(true);
    } catch (error) {
      console.error(error);
    }
  };

  const pauseSound = async () => {
    try {
      if (currentSound.current) {
        // Met en pause la lecture du son
        await currentSound.current.pauseAsync();
        setIsPlaying(false);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const updateSoundStatus = (status) => {
    if (status.isLoaded) {
      // Met à jour la position, la durée et l'état de lecture du son
      setPosition(status.positionMillis);
      setDuration(status.durationMillis);
      setIsPlaying(status.isPlaying);
      if (status.didJustFinish) {
        // Réinitialise la position et l'état de lecture lorsque le son se termine
        setPosition(0);
        setIsPlaying(false);
        clearInterval(intervalRef.current);
      }
    }
  };

  const formatTime = (millis) => {
    // Formate le temps en minutes:secondes
    const minutes = Math.floor(millis / 60000);
    const seconds = ((millis % 60000) / 1000).toFixed(0);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  useEffect(() => {
    if (isPlaying) {
      // Met à jour périodiquement la position et l'état de lecture du son en cours
      intervalRef.current = setInterval(async () => {
        if (currentSound.current) {
          const status = await currentSound.current.getStatusAsync();
          updateSoundStatus(status);
        }
      }, 500);
    } else {
      clearInterval(intervalRef.current);
    }
  }, [isPlaying]);

  const handleSliderValueChange = async (value) => {
    if (currentSound.current) {
      // Met à jour la position du son en fonction de la valeur du curseur
      const positionMillis = value * duration;
      await currentSound.current.setPositionAsync(positionMillis);
      setPosition(positionMillis);
      // Ne pas mettre à jour l'état de lecture si la musique est en pause
      if (isPlaying) {
        setIsPlaying(true);
      }
    }
  };

  useEffect(() => {
    const cleanup = async () => {
      if (currentSound.current) {
        // Arrête et décharge le son en cours lors de la navigation vers un autre écran
        await currentSound.current.stopAsync();
        await currentSound.current.unloadAsync();
        currentSound.current = null;
        setPosition(0);
        clearInterval(intervalRef.current);
      }
    };

    const unsubscribe = navigation.addListener('blur', cleanup);

    return () => {
      unsubscribe();
      cleanup();
    };
  }, [navigation]);

  const rateSong = async () => {
    try {
      // Enregistre la note de la chanson dans le stockage local
      await AsyncStorage.setItem(`rating_${item.trackId}`, rating.toString());
      Alert.alert('Rating saved successfully!');

      const storedSongList = JSON.parse(await AsyncStorage.getItem('songList')) || [];

      const existingSongIndex = storedSongList.findIndex(s => s.trackId === item.trackId);
      if (existingSongIndex !== -1) {
        // Met à jour la note de la chanson dans la liste des chansons stockées
        storedSongList[existingSongIndex].rating = rating;
      } else {
        // Ajoute la chanson à la liste des chansons stockées avec la note
        storedSongList.push({ ...item, rating });
      }

      await AsyncStorage.setItem('songList', JSON.stringify(storedSongList));
      navigation.navigate('Ladder', { songList: storedSongList });
    } catch (error) {
      console.error(error);
      Alert.alert('Failed to save rating');
    }
  };
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{item.trackName}</Text>
      <Text style={styles.artist}>{item.artistName}</Text>
      <Text style={styles.collection}>{item.collectionName}</Text>
    
      <Animatable.View animation="bounceIn" duration={1500} style={styles.iconContainer}>
        <TouchableOpacity onPress={isFavorite ? removeFromFavorites : addToFavorites}>
          <View style={styles.favoriteBox}>
            <Text style={styles.favoriteText}>{isFavorite ? 'Remove from favorites' : 'Add to favorites'}</Text>
            <Icon
              name={isFavorite ? 'heart' : 'heart-o'}
              type="font-awesome"
              color={isFavorite ? '#f50' : '#ccc'}
              size={30}
            />
          </View>
        </TouchableOpacity>
      </Animatable.View>
      <Button title={isPlaying ? "Pause Preview" : "Play Preview"} onPress={isPlaying ? pauseSound : playSound} />
      <View style={styles.timerContainer}>
        <Text style={styles.timerText}>{formatTime(position)}</Text>
        <Text style={styles.timerText}> / </Text>
        <Text style={styles.timerText}>{formatTime(duration)}</Text>
      </View>
      <Slider
        style={{ width: '100%', height: 40 }}
        minimumValue={0}
        maximumValue={1}
        value={duration ? position / duration : 0}
        onValueChange={handleSliderValueChange}
        minimumTrackTintColor="#FFFFFF"
        maximumTrackTintColor="#000000"
      />
      
      <View style={styles.ratingContainer}>
        <Rating
          showRating
          startingValue={rating}
          onFinishRating={(value) => setRating(value)}
        />
        <TouchableOpacity onPress={rateSong}>
          <Text style={styles.rateText}>Rate</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  artist: {
    fontSize: 18,
    marginVertical: 10,
  },
  collection: {
    fontSize: 16,
    color: 'gray',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
  },
  rateText: {
    fontSize: 16,
    marginLeft: 10,
    borderRadius: 10,
    backgroundColor: 'rgba(229, 153, 0, 0.4)',
    fontSize: 16,
    color: 'rgba(229, 135, 0, 1)',
    textDecorationLine: 'none',
    padding: 7,
    marginTop: 60,
  },
  iconContainer: {
    marginTop: 20,
    alignItems: 'center',
  },
  favoriteText: {
    marginRight: 10,
    fontSize: 16,
  },
  timerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
  timerText: {
    fontSize: 16,
    color: 'gray',
  },
  favoriteBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
    borderRadius: 5,
    backgroundColor: '#f9f9f9',
    elevation: 6,
    marginBottom: 20,
  },
});