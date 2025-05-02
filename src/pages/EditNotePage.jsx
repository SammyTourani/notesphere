import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useOfflineNotes } from '../context/OfflineNotesContext';
import OfflineEditor from '../components/OfflineEditor';
import { getFirestore, doc, getDoc } from 'firebase/firestore';

export default function EditNotePage() {
  const { noteId } = useParams();
  const { localNotes, saveNoteToCloud, user } = useOfflineNotes();
  const [note, setNote] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  
  // First check if the note exists in local storage
  useEffect(() => {
    // If no noteId, we're creating a new note
    if (!noteId) {
      setNote({
        id: `local-${Date.now()}`,
        title: '',
        content: '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      setIsLoading(false);
      return;
    }
    
    // Check if it exists in local cache first
    const localNote = localNotes.find(n => n.id === noteId);
    if (localNote) {
      setNote(localNote);
      setIsLoading(false);
      return;
    }
    
    // If not in local storage and user is logged in, try to fetch from Firestore
    const fetchNoteFromFirestore = async () => {
      if (!user) {
        navigate('/notes');
        return;
      }
      
      try {
        const db = getFirestore();
        const noteRef = doc(db, `users/${user.uid}/notes/${noteId}`);
        const noteSnap = await getDoc(noteRef);
        
        if (noteSnap.exists()) {
          const noteData = { id: noteSnap.id, ...noteSnap.data() };
          // Store in localStorage for offline access
          localStorage.setItem(`note-${noteId}`, JSON.stringify(noteData));
          setNote(noteData);
        } else {
          // Note doesn't exist
          navigate('/notes');
        }
      } catch (error) {
        console.error('Error fetching note:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    if (user) {
      fetchNoteFromFirestore();
    } else {
      setIsLoading(false);
    }
  }, [noteId, localNotes, user, navigate]);
  
  const handleSaveToCloud = useCallback(async (noteData) => {
    return saveNoteToCloud(noteData);
  }, [saveNoteToCloud]);
  
  // Show minimal loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-900">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return <OfflineEditor initialNoteData={note} onSaveToCloud={handleSaveToCloud} />;
}