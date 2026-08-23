import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Modal,
  TextInput,
  ActivityIndicator,
  ScrollView,
  Alert,
} from 'react-native';
import {
  FileCode, Plus, Trash2, Edit3, X, Save, FolderOpen, Search,
} from 'lucide-react-native';
import { Colors } from '@/lib/theme';
import { supabase, type FileRecord } from '@/lib/supabase';
import { SERVICES, LANGUAGES, detectLanguage, type ServiceType } from '@/lib/types';

export default function FilesScreen() {
  const [files, setFiles] = useState<FileRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterService, setFilterService] = useState<ServiceType | 'all'>('all');
  const [editingFile, setEditingFile] = useState<FileRecord | null>(null);
  const [showEditor, setShowEditor] = useState(false);
  const [showNewFile, setShowNewFile] = useState(false);
  const [newFileName, setNewFileName] = useState('');
  const [newFileService, setNewFileService] = useState<ServiceType>('local');
  const [newFileLanguage, setNewFileLanguage] = useState('Plain Text');
  const [editContent, setEditContent] = useState('');

  useEffect(() => {
    loadFiles();
  }, []);

  const loadFiles = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('files')
      .select('*')
      .order('updated_at', { ascending: false });
    if (!error && data) {
      setFiles(data);
    }
    setLoading(false);
  };

  const createFile = async () => {
    if (!newFileName.trim()) return;
    const lang = newFileLanguage === 'Plain Text' ? detectLanguage(newFileName) : newFileLanguage;
    const { data, error } = await supabase
      .from('files')
      .insert({
        name: newFileName.trim(),
        path: `/${newFileName.trim()}`,
        language: lang,
        content: '',
        service: newFileService,
        size: 0,
      })
      .select()
      .single();
    if (!error && data) {
      setFiles([data, ...files]);
      setShowNewFile(false);
      setNewFileName('');
      setNewFileService('local');
      setNewFileLanguage('Plain Text');
    }
  };

  const updateFileContent = async () => {
    if (!editingFile) return;
    const { error } = await supabase
      .from('files')
      .update({
        content: editContent,
        size: editContent.length,
        updated_at: new Date().toISOString(),
      })
      .eq('id', editingFile.id);
    if (!error) {
      setFiles(files.map((f) =>
        f.id === editingFile.id
          ? { ...f, content: editContent, size: editContent.length, updated_at: new Date().toISOString() }
          : f
      ));
      setShowEditor(false);
      setEditingFile(null);
    }
  };

  const deleteFile = (file: FileRecord) => {
    Alert.alert(
      'Delete File',
      `Are you sure you want to delete "${file.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const { error } = await supabase.from('files').delete().eq('id', file.id);
            if (!error) {
              setFiles(files.filter((f) => f.id !== file.id));
            }
          },
        },
      ]
    );
  };

  const openEditor = (file: FileRecord) => {
    setEditingFile(file);
    setEditContent(file.content);
    setShowEditor(true);
  };

  const filteredFiles = files.filter((f) => {
    const matchesSearch = f.name.toLowerCase().includes(search.toLowerCase());
    const matchesService = filterService === 'all' || f.service === filterService;
    return matchesSearch && matchesService;
  });

  const getServiceColor = (service: string) => {
    const s = SERVICES.find((sv) => sv.name === service);
    return s?.bgColor || Colors.neutral[500];
  };

  const renderFile = ({ item }: { item: FileRecord }) => (
    <View style={styles.fileCard}>
      <TouchableOpacity style={styles.fileInfo} onPress={() => openEditor(item)}>
        <View style={[styles.fileIcon, { backgroundColor: getServiceColor(item.service) }]}>
          <FileCode size={20} color="#fff" strokeWidth={2} />
        </View>
        <View style={styles.fileDetails}>
          <Text style={styles.fileName} numberOfLines={1}>{item.name}</Text>
          <Text style={styles.fileMeta}>
            {item.language || 'Plain Text'} - {item.service} - {item.size} bytes
          </Text>
          <Text style={styles.filePath} numberOfLines={1}>{item.path}</Text>
        </View>
      </TouchableOpacity>
      <View style={styles.fileActions}>
        <TouchableOpacity style={styles.fileActionBtn} onPress={() => openEditor(item)}>
          <Edit3 size={18} color={Colors.neutral[600]} strokeWidth={2} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.fileActionBtn} onPress={() => deleteFile(item)}>
          <Trash2 size={18} color={Colors.error[500]} strokeWidth={2} />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Files</Text>
        <TouchableOpacity style={styles.addButton} onPress={() => setShowNewFile(true)}>
          <Plus size={22} color={Colors.primary[600]} strokeWidth={2} />
        </TouchableOpacity>
      </View>

      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Search size={18} color={Colors.neutral[400]} strokeWidth={2} />
          <TextInput
            style={styles.searchInput}
            value={search}
            onChangeText={setSearch}
            placeholder="Search files..."
            placeholderTextColor={Colors.neutral[400]}
          />
        </View>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterBar}>
        <TouchableOpacity
          style={[styles.filterChip, filterService === 'all' && styles.filterChipActive]}
          onPress={() => setFilterService('all')}>
          <Text style={[styles.filterChipText, filterService === 'all' && styles.filterChipTextActive]}>All</Text>
        </TouchableOpacity>
        {SERVICES.map((service) => (
          <TouchableOpacity
            key={service.name}
            style={[styles.filterChip, filterService === service.name && styles.filterChipActive]}
            onPress={() => setFilterService(service.name)}>
            <Text style={[styles.filterChipText, filterService === service.name && styles.filterChipTextActive]}>
              {service.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary[500]} />
        </View>
      ) : filteredFiles.length === 0 ? (
        <View style={styles.emptyState}>
          <View style={styles.emptyIconContainer}>
            <FolderOpen size={48} color={Colors.neutral[300]} strokeWidth={1.5} />
          </View>
          <Text style={styles.emptyTitle}>No Files Yet</Text>
          <Text style={styles.emptySubtitle}>Create a new file or generate one from the Chat tab</Text>
          <TouchableOpacity style={styles.emptyButton} onPress={() => setShowNewFile(true)}>
            <Plus size={20} color="#fff" strokeWidth={2} />
            <Text style={styles.emptyButtonText}>Create File</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={filteredFiles}
          renderItem={renderFile}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.fileList}
        />
      )}

      <Modal visible={showNewFile} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>New File</Text>
              <TouchableOpacity onPress={() => setShowNewFile(false)}>
                <X size={24} color={Colors.neutral[600]} strokeWidth={2} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalBody}>
              <Text style={styles.inputLabel}>File Name</Text>
              <TextInput
                style={styles.textInput}
                value={newFileName}
                onChangeText={setNewFileName}
                placeholder="example.py"
                placeholderTextColor={Colors.neutral[400]}
                autoCapitalize="none"
              />
              <Text style={styles.inputLabel}>Service</Text>
              <View style={styles.serviceGrid}>
                {SERVICES.map((service) => (
                  <TouchableOpacity
                    key={service.name}
                    style={[styles.serviceOption, newFileService === service.name && styles.serviceOptionSelected]}
                    onPress={() => setNewFileService(service.name)}>
                    <View style={[styles.serviceDot, { backgroundColor: service.bgColor }]}>
                      <FileCode size={14} color="#fff" strokeWidth={2} />
                    </View>
                    <Text style={styles.serviceOptionText}>{service.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <Text style={styles.inputLabel}>Language</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.langScroll}>
                {LANGUAGES.map((lang) => (
                  <TouchableOpacity
                    key={lang}
                    style={[styles.langOption, newFileLanguage === lang && styles.langOptionSelected]}
                    onPress={() => setNewFileLanguage(lang)}>
                    <Text style={[styles.langOptionText, newFileLanguage === lang && styles.langOptionTextSelected]}>{lang}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
              <TouchableOpacity style={styles.createButton} onPress={createFile}>
                <Save size={20} color="#fff" strokeWidth={2} />
                <Text style={styles.createButtonText}>Create File</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      <Modal visible={showEditor} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.editorContent}>
            <View style={styles.modalHeader}>
              <View style={styles.editorTitleContainer}>
                <FileCode size={20} color={Colors.primary[500]} strokeWidth={2} />
                <Text style={styles.modalTitle} numberOfLines={1}>{editingFile?.name}</Text>
              </View>
              <TouchableOpacity onPress={() => { setShowEditor(false); setEditingFile(null); }}>
                <X size={24} color={Colors.neutral[600]} strokeWidth={2} />
              </TouchableOpacity>
            </View>
            <View style={styles.editorMetaBar}>
              <Text style={styles.editorMetaText}>{editingFile?.language || 'Plain Text'}</Text>
              <Text style={styles.editorMetaText}>{editingFile?.service}</Text>
              <Text style={styles.editorMetaText}>{editContent.length} bytes</Text>
            </View>
            <ScrollView style={styles.editorScroll}>
              <TextInput
                style={styles.editorInput}
                value={editContent}
                onChangeText={setEditContent}
                multiline
                textAlignVertical="top"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </ScrollView>
            <View style={styles.editorActions}>
              <TouchableOpacity style={styles.cancelButton} onPress={() => { setShowEditor(false); setEditingFile(null); }}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveButton} onPress={updateFileContent}>
                <Save size={18} color="#fff" strokeWidth={2} />
                <Text style={styles.saveButtonText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.neutral[50] },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingTop: 48, paddingBottom: 12,
    backgroundColor: Colors.neutral[0],
    borderBottomWidth: 1, borderBottomColor: Colors.neutral[200],
  },
  headerTitle: { fontFamily: 'Inter-Bold', fontSize: 22, color: Colors.neutral[900] },
  addButton: { padding: 8, borderRadius: 8 },
  searchContainer: { paddingHorizontal: 16, paddingVertical: 12, backgroundColor: Colors.neutral[0] },
  searchInputContainer: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.neutral[100], borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 10, gap: 10,
  },
  searchInput: { flex: 1, fontFamily: 'Inter-Regular', fontSize: 15, color: Colors.neutral[900] },
  filterBar: {
    paddingHorizontal: 16, paddingBottom: 12,
    backgroundColor: Colors.neutral[0],
    borderBottomWidth: 1, borderBottomColor: Colors.neutral[200],
  },
  filterChip: {
    backgroundColor: Colors.neutral[100], borderRadius: 20,
    paddingHorizontal: 16, paddingVertical: 8, marginRight: 8,
  },
  filterChipActive: { backgroundColor: Colors.primary[500] },
  filterChipText: { fontFamily: 'Inter-Medium', fontSize: 13, color: Colors.neutral[600] },
  filterChipTextActive: { color: '#fff' },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
  emptyIconContainer: {
    width: 96, height: 96, borderRadius: 24,
    backgroundColor: Colors.neutral[100],
    alignItems: 'center', justifyContent: 'center', marginBottom: 24,
  },
  emptyTitle: { fontFamily: 'Inter-Bold', fontSize: 22, color: Colors.neutral[900], marginBottom: 8 },
  emptySubtitle: {
    fontFamily: 'Inter-Regular', fontSize: 15, color: Colors.neutral[500],
    textAlign: 'center', marginBottom: 24,
  },
  emptyButton: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: Colors.primary[500], borderRadius: 12,
    paddingHorizontal: 24, paddingVertical: 14,
  },
  emptyButtonText: { fontFamily: 'Inter-SemiBold', fontSize: 15, color: '#fff' },
  fileList: { padding: 16 },
  fileCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.neutral[0], borderRadius: 14, padding: 12,
    marginBottom: 10, borderWidth: 1, borderColor: Colors.neutral[200],
  },
  fileInfo: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12 },
  fileIcon: { width: 44, height: 44, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  fileDetails: { flex: 1 },
  fileName: { fontFamily: 'Inter-SemiBold', fontSize: 15, color: Colors.neutral[900], marginBottom: 2 },
  fileMeta: { fontFamily: 'Inter-Regular', fontSize: 12, color: Colors.neutral[500], marginBottom: 2 },
  filePath: { fontFamily: 'JetBrainsMono-Regular', fontSize: 11, color: Colors.neutral[400] },
  fileActions: { flexDirection: 'row', gap: 4 },
  fileActionBtn: { padding: 8, borderRadius: 8 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: {
    backgroundColor: Colors.neutral[0],
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    maxHeight: '85%', paddingBottom: 32,
  },
  modalHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingVertical: 16,
    borderBottomWidth: 1, borderBottomColor: Colors.neutral[200],
  },
  modalTitle: { fontFamily: 'Inter-Bold', fontSize: 18, color: Colors.neutral[900], marginLeft: 8 },
  modalBody: { padding: 20 },
  inputLabel: {
    fontFamily: 'Inter-SemiBold', fontSize: 14, color: Colors.neutral[700],
    marginBottom: 8, marginTop: 12,
  },
  textInput: {
    backgroundColor: Colors.neutral[100], borderRadius: 12,
    paddingHorizontal: 16, paddingVertical: 14,
    fontFamily: 'JetBrainsMono-Regular', fontSize: 15, color: Colors.neutral[900],
  },
  serviceGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  serviceOption: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: Colors.neutral[100], borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 10,
    borderWidth: 2, borderColor: 'transparent',
  },
  serviceOptionSelected: { borderColor: Colors.primary[500], backgroundColor: Colors.primary[50] },
  serviceDot: { width: 24, height: 24, borderRadius: 6, alignItems: 'center', justifyContent: 'center' },
  serviceOptionText: { fontFamily: 'Inter-Medium', fontSize: 13, color: Colors.neutral[700] },
  langScroll: { flexDirection: 'row' },
  langOption: {
    backgroundColor: Colors.neutral[100], borderRadius: 8,
    paddingHorizontal: 12, paddingVertical: 8, marginRight: 6,
  },
  langOptionSelected: { backgroundColor: Colors.primary[500] },
  langOptionText: { fontFamily: 'Inter-Medium', fontSize: 13, color: Colors.neutral[600] },
  langOptionTextSelected: { color: '#fff' },
  createButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: Colors.primary[500], borderRadius: 14, paddingVertical: 16, marginTop: 24,
  },
  createButtonText: { fontFamily: 'Inter-SemiBold', fontSize: 16, color: '#fff' },
  editorContent: {
    backgroundColor: Colors.neutral[0],
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    flex: 1, maxHeight: '90%',
  },
  editorTitleContainer: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  editorMetaBar: {
    flexDirection: 'row', gap: 16, paddingHorizontal: 20, paddingVertical: 8,
    backgroundColor: Colors.neutral[50],
    borderBottomWidth: 1, borderBottomColor: Colors.neutral[200],
  },
  editorMetaText: { fontFamily: 'JetBrainsMono-Regular', fontSize: 12, color: Colors.neutral[500] },
  editorScroll: { flex: 1, padding: 16 },
  editorInput: {
    fontFamily: 'JetBrainsMono-Regular', fontSize: 14, lineHeight: 22,
    color: Colors.neutral[900], textAlignVertical: 'top', minHeight: 300,
  },
  editorActions: {
    flexDirection: 'row', gap: 12, paddingHorizontal: 20, paddingVertical: 16,
    borderTopWidth: 1, borderTopColor: Colors.neutral[200],
  },
  cancelButton: {
    flex: 1, alignItems: 'center', paddingVertical: 14, borderRadius: 12,
    backgroundColor: Colors.neutral[100],
  },
  cancelButtonText: { fontFamily: 'Inter-SemiBold', fontSize: 15, color: Colors.neutral[600] },
  saveButton: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    paddingVertical: 14, borderRadius: 12, backgroundColor: Colors.primary[500],
  },
  saveButtonText: { fontFamily: 'Inter-SemiBold', fontSize: 15, color: '#fff' },
});
