import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, Modal, TextInput, KeyboardAvoidingView, Platform, Animated, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, FONTS, FONT_SIZES, SPACING, BORDER_RADIUS, SHADOWS } from '@/constants/theme';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { PlusCircle, Pencil, Trash2, X, Clock, Search, Filter, ArrowLeft } from 'lucide-react-native';
import { useTheme } from '@/context/theme';
import { useAuth } from '@/context/auth';
import { notesApi } from '@/utils/api';
import SyncStatus from '@/components/ui/SyncStatus';
import { getTimeElapsedString } from '@/utils/time';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface Note {
  id: number;
  user_id: number;
  title: string;
  content: string;
  visibility: string;
  noteable_type: string;
  noteable_id: number;
  organization_id: number;
  created_at: string;
  updated_at: string;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    ...SHADOWS.sm,
    zIndex: 2,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    marginRight: SPACING.sm,
  },
  title: {
    fontFamily: FONTS.bold,
    fontSize: FONT_SIZES.xl,
  },
  list: {
    padding: SPACING.lg,
    paddingBottom: SPACING.lg * 2,
  },
  noteCard: {
    marginBottom: SPACING.lg,
    borderRadius: BORDER_RADIUS.lg,
    ...SHADOWS.md,
  },
  noteHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.md,
  },
  noteTitle: {
    fontFamily: FONTS.bold,
    fontSize: FONT_SIZES.lg,
    marginBottom: SPACING.xs,
    flex: 1,
    paddingRight: SPACING.md,
  },
  noteContent: {
    fontFamily: FONTS.regular,
    fontSize: FONT_SIZES.md,
    lineHeight: FONT_SIZES.md * 1.5,
    marginBottom: SPACING.md,
  },
  noteActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: SPACING.md,
    marginTop: SPACING.xs,
  },
  actionButton: {
    padding: SPACING.xs,
    borderRadius: BORDER_RADIUS.full,
  },
  fab: {
    position: 'absolute',
    bottom: SPACING.xl,
    right: SPACING.xl,
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.lg,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  emptyStateText: {
    fontFamily: FONTS.medium,
    fontSize: FONT_SIZES.lg,
    textAlign: 'center',
    marginTop: SPACING.lg,
    lineHeight: FONT_SIZES.lg * 1.5,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  modalContent: {
    width: '90%',
    maxWidth: 500,
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.xl,
    ...SHADOWS.lg,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  modalTitle: {
    fontFamily: FONTS.bold,
    fontSize: FONT_SIZES.xl,
  },
  closeButton: {
    padding: SPACING.xs,
    borderRadius: BORDER_RADIUS.full,
  },
  inputContainer: {
    marginBottom: SPACING.lg,
  },
  inputLabel: {
    fontFamily: FONTS.medium,
    fontSize: FONT_SIZES.md,
    marginBottom: SPACING.sm,
  },
  input: {
    borderWidth: 1,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    fontFamily: FONTS.regular,
    fontSize: FONT_SIZES.md,
  },
  textArea: {
    height: 150,
    textAlignVertical: 'top',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: SPACING.md,
    marginTop: SPACING.lg,
  },
  noteMetadata: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SPACING.sm,
  },
  metadataText: {
    fontFamily: FONTS.medium,
    fontSize: FONT_SIZES.sm,
    marginLeft: SPACING.xs,
  },
  lastRefreshContainer: {
    alignItems: 'center',
    paddingVertical: SPACING.sm,
  },
  lastRefreshText: {
    fontFamily: FONTS.regular,
    fontSize: FONT_SIZES.sm,
  },
  searchContainer: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    gap: SPACING.sm,
    position: 'absolute',
    top: 110,
    left: 0,
    right: 0,
    zIndex: 1,
  },
  searchInput: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: BORDER_RADIUS.lg,
    paddingHorizontal: SPACING.md,
    height: 48,
    borderWidth: 1,
    ...SHADOWS.sm,
  },
  searchTextInput: {
    flex: 1,
    marginLeft: SPACING.sm,
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.regular,
    height: '100%',
  },
  filterButton: {
    width: 48,
    height: 48,
    borderRadius: BORDER_RADIUS.lg,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    ...SHADOWS.sm,
  },
});

function NotesScreen() {
  const { theme, themeType } = useTheme();
  const [token, setToken] = useState<string | null>(null);
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [lastRefreshTime, setLastRefreshTime] = useState<Date | null>(null);
  const [syncState, setSyncState] = useState<'syncing' | 'synced' | 'error'>('synced');
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(true);
  const lastScrollY = useRef(0);
  const searchBarHeight = useRef(new Animated.Value(1)).current;
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isSearchFocused = useRef(false);
  const router = useRouter();

  const startHideTimer = () => {
    if (hideTimer.current) {
      clearTimeout(hideTimer.current);
    }
    
    if (!searchQuery && !isSearchFocused.current) {
      hideTimer.current = setTimeout(() => {
        if (!searchQuery && !isSearchFocused.current) {
          Animated.timing(searchBarHeight, {
            toValue: 0,
            duration: 200,
            useNativeDriver: true,
          }).start(() => setShowSearch(false));
        }
      }, 3000);
    }
  };

  const handleSearchFocus = () => {
    isSearchFocused.current = true;
    if (hideTimer.current) {
      clearTimeout(hideTimer.current);
    }
    if (!showSearch) {
      setShowSearch(true);
      Animated.timing(searchBarHeight, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  };

  const handleSearchBlur = () => {
    isSearchFocused.current = false;
    startHideTimer();
  };

  const handleSearchChange = (text: string) => {
    setSearchQuery(text);
    if (text) {
      if (hideTimer.current) {
        clearTimeout(hideTimer.current);
      }
      if (!showSearch) {
        setShowSearch(true);
        Animated.timing(searchBarHeight, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }).start();
      }
    } else {
      startHideTimer();
    }
  };

  useEffect(() => {
    startHideTimer();
    return () => {
      if (hideTimer.current) {
        clearTimeout(hideTimer.current);
      }
    };
  }, [searchQuery]);

  const handleScroll = (event: any) => {
    const currentScrollY = event.nativeEvent.contentOffset.y;
    const isScrollingDown = currentScrollY > lastScrollY.current;
    const isScrollingUp = currentScrollY < lastScrollY.current;
    
    if (Math.abs(currentScrollY - lastScrollY.current) > 10) {
      if (isScrollingDown && showSearch && !searchQuery && !isSearchFocused.current) {
        Animated.timing(searchBarHeight, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }).start(() => setShowSearch(false));
      } else if (isScrollingUp && !showSearch) {
        setShowSearch(true);
        Animated.timing(searchBarHeight, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }).start();
      }
    }
    
    lastScrollY.current = currentScrollY;
  };

  useEffect(() => {
    const getToken = async () => {
      const storedToken = await AsyncStorage.getItem('token');
      setToken(storedToken);
    };
    getToken();
  }, []);

  const fetchNotes = async () => {
    setLoading(true);
    setSyncState('syncing');
    try {
      const response = await notesApi.getNotes();
      if (response.status === 'true') {
        const sortedNotes = response.notes.sort((a, b) => {
          const dateA = new Date(Math.max(new Date(a.created_at).getTime(), new Date(a.updated_at).getTime()));
          const dateB = new Date(Math.max(new Date(b.created_at).getTime(), new Date(b.updated_at).getTime()));
          return dateB.getTime() - dateA.getTime();
        });
        setNotes(sortedNotes);
        setLastRefreshTime(new Date());
        setSyncState('synced');
      }
    } catch (error) {
      console.error('Error fetching notes:', error);
      Alert.alert('Error', 'Failed to fetch notes');
      setSyncState('error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchNotes();
  };

  useEffect(() => {
    if (token) {
      fetchNotes();
    }
  }, [token]);

  const handleDeleteNote = async (id: number) => {
    Alert.alert(
      'Delete Note',
      'Are you sure you want to delete this note?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await notesApi.deleteNote(id);
              if (response.status === 'true') {
                setNotes(notes.filter(note => note.id !== id));
                Alert.alert('Success', 'Note deleted successfully');
              }
            } catch (error) {
              console.error('Error deleting note:', error);
              Alert.alert('Error', 'Failed to delete note');
            }
          },
        },
      ]
    );
  };

  const handleAddNote = async () => {
    if (!title.trim() || !content.trim()) {
      Alert.alert('Error', 'Please enter both title and content');
      return;
    }
    try {
      const response = await notesApi.addNote(title.trim(), content.trim());
      if (response.message === 'Note added successfully') {
        await fetchNotes();
        setModalVisible(false);
        setTitle('');
        setContent('');
        Alert.alert('Success', 'Note added successfully');
      } else {
        throw new Error(response.message || 'Failed to add note');
      }
    } catch (error) {
      console.error('Error adding note:', error);
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to add note');
    }
  };

  const handleUpdateNote = async () => {
    if (!editingNote) return;
    try {
      const response = await notesApi.updateNote(editingNote.id, title, content);
      if (response.status === 'true') {
        await fetchNotes();
        setModalVisible(false);
        setEditingNote(null);
        setTitle('');
        setContent('');
        Alert.alert('Success', 'Note updated successfully');
      }
    } catch (error) {
      console.error('Error updating note:', error);
      Alert.alert('Error', 'Failed to update note');
    }
  };

  const openEditModal = (note: Note) => {
    setEditingNote(note);
    setTitle(note.title);
    setContent(note.content);
    setModalVisible(true);
  };

  const openAddModal = () => {
    setEditingNote(null);
    setTitle('');
    setContent('');
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setEditingNote(null);
    setTitle('');
    setContent('');
  };

  const renderItem = ({ item }: { item: Note }) => {
    const createdDate = new Date(item.created_at);
    const updatedDate = new Date(item.updated_at);
    const displayDate = updatedDate > createdDate ? updatedDate : createdDate;
    const message = updatedDate > createdDate ? 'Updated on' : 'Added on';

    return (
      <Card style={{ ...styles.noteCard, backgroundColor: theme.card }}>
        <View style={styles.noteHeader}>
          <Text style={[styles.noteTitle, { color: theme.text }]}>{item.title}</Text>
          <View style={styles.noteActions}>
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: theme.background }]}
              onPress={() => openEditModal(item)}
            >
              <Pencil size={20} color={COLORS.warning.light} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: theme.background }]}
              onPress={() => handleDeleteNote(item.id)}
            >
              <Trash2 size={20} color={theme.error} />
            </TouchableOpacity>
          </View>
        </View>
        <Text style={[styles.noteContent, { color: theme.text }]}>{item.content}</Text>
        <View style={styles.noteMetadata}>
          <Clock size={16} color={theme.secondaryText} />
          <Text style={[styles.metadataText, { color: theme.secondaryText }]}>
            {`${message} ${displayDate.toLocaleString()}`}
          </Text>
        </View>
      </Card>
    );
  };

  const filteredNotes = notes.filter(note => 
    note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    note.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <SafeAreaView edges={['top']} style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { backgroundColor: theme.card, borderBottomColor: theme.border }]}>
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <ArrowLeft size={24} color={theme.text} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: theme.text }]}>Notes</Text>
        </View>
        {lastRefreshTime && (
          <SyncStatus state={syncState} lastSynced={getTimeElapsedString(lastRefreshTime)} />
        )}
      </View>

      <Animated.View 
        style={[
          styles.searchContainer,
          {
            transform: [{
              translateY: searchBarHeight.interpolate({
                inputRange: [0, 1],
                outputRange: [-80, 0]
              })
            }],
            opacity: searchBarHeight,
            maxHeight: 80,
            overflow: 'hidden',
            backgroundColor: theme.background
          }
        ]}
      >
        <View style={[styles.searchInput, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Search size={20} color={theme.secondaryText} />
          <TextInput
            style={[styles.searchTextInput, { color: theme.text }]}
            placeholder="Search notes..."
            placeholderTextColor={theme.secondaryText}
            value={searchQuery}
            onChangeText={handleSearchChange}
            onFocus={handleSearchFocus}
            onBlur={handleSearchBlur}
          />
        </View>
        <TouchableOpacity
          style={[styles.filterButton, { backgroundColor: theme.card, borderColor: theme.border }]}
          onPress={() => {
            handleSearchFocus();
            /* TODO: Implement filter functionality */
          }}
        >
          <Filter size={20} color={theme.secondaryText} />
        </TouchableOpacity>
      </Animated.View>

      <FlatList
        data={filteredNotes}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderItem}
        contentContainerStyle={[styles.list, { paddingTop: 80 }]}
        showsVerticalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[COLORS.primary.light]}
            tintColor={COLORS.primary.light}
          />
        }
      />

      <TouchableOpacity
        style={[styles.fab, { backgroundColor: COLORS.primary.light }]}
        onPress={openAddModal}
      >
        <PlusCircle size={28} color={COLORS.white} />
      </TouchableOpacity>

      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={closeModal}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalContainer}
        >
          <View style={[styles.modalContent, { backgroundColor: theme.card }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>
                {editingNote ? 'Edit Note' : 'Add Note'}
              </Text>
              <TouchableOpacity
                onPress={closeModal}
                style={[styles.closeButton, { backgroundColor: theme.background }]}
              >
                <X size={24} color={theme.text} />
              </TouchableOpacity>
            </View>

            <View style={styles.inputContainer}>
              <Text style={[styles.inputLabel, { color: theme.text }]}>Title</Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    color: theme.text,
                    borderColor: theme.border,
                    backgroundColor: theme.background,
                  },
                ]}
                value={title}
                onChangeText={setTitle}
                placeholder="Enter note title"
                placeholderTextColor={theme.secondaryText}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={[styles.inputLabel, { color: theme.text }]}>Content</Text>
              <TextInput
                style={[
                  styles.input,
                  styles.textArea,
                  {
                    color: theme.text,
                    borderColor: theme.border,
                    backgroundColor: theme.background,
                  },
                ]}
                value={content}
                onChangeText={setContent}
                placeholder="Enter note content"
                placeholderTextColor={theme.secondaryText}
                multiline
              />
            </View>

            <View style={styles.modalActions}>
              <Button
                variant="outlined"
                title="Cancel"
                onPress={closeModal}
                style={{ minWidth: 120 }}
              />
              <Button
                title={editingNote ? 'Update' : 'Add'}
                onPress={editingNote ? handleUpdateNote : handleAddNote}
                style={{ minWidth: 120 }}
                color="success"
              />
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

export default NotesScreen; 