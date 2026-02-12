import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    FlatList,
    TextInput,
    Modal,
    Alert,
    ActivityIndicator,
    ScrollView,
    Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { supabase } from '../../utils/supabase';
import { useAdmin, Category } from '../../context/AdminContext';
import { useAuth } from '../../context/AuthContext';
import { Question } from '../../context/GameContext';
// import * as XLSX from 'xlsx'; // Dynamically imported for optimization
import * as DocumentPicker from 'expo-document-picker';

export const QuestionsScreen: React.FC = () => {
    const navigation = useNavigation();
    const { categories, refreshCategories } = useAdmin();
    const [questions, setQuestions] = useState<Question[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
    const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<number | null>(null);

    // Form state
    const [categoryId, setCategoryId] = useState<number | null>(null);
    const [questionText, setQuestionText] = useState('');
    const [options, setOptions] = useState(['', '', '', '']);
    const [answer, setAnswer] = useState('');
    const [reference, setReference] = useState('');
    const [points, setPoints] = useState('100');

    // Language States - English
    const [questionEn, setQuestionEn] = useState('');
    const [answerEn, setAnswerEn] = useState('');
    const [optionsEn, setOptionsEn] = useState(['', '', '', '']);
    const [referenceEn, setReferenceEn] = useState('');

    // Language States - Portuguese
    const [questionPt, setQuestionPt] = useState('');
    const [answerPt, setAnswerPt] = useState('');
    const [optionsPt, setOptionsPt] = useState(['', '', '', '']);
    const [referencePt, setReferencePt] = useState('');

    useEffect(() => {
        refreshCategories();
        loadQuestions();
    }, []);

    const loadQuestions = async () => {
        setIsLoading(true);
        try {
            const { data, error } = await supabase
                .from('questions')
                .select('*')
                .order('category', { ascending: true });
            if (error) throw error;
            setQuestions(data || []);
        } catch (error) {
            console.error('Error loading questions:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const filteredQuestions = selectedCategoryFilter
        ? questions.filter((q) => {
            const cat = categories.find((c) => c.name === q.category);
            return cat?.id === selectedCategoryFilter;
        })
        : questions;

    const openAddModal = () => {
        setEditingQuestion(null);
        setCategoryId(categories[0]?.id || null);
        setQuestionText('');
        setOptions(['', '', '', '']);
        setAnswer('');
        setReference('');
        setPoints('100');
        setReference('');
        setPoints('100');

        // Reset EN
        setQuestionEn('');
        setAnswerEn('');
        setOptionsEn(['', '', '', '']);
        setReferenceEn('');

        // Reset PT
        setQuestionPt('');
        setAnswerPt('');
        setOptionsPt(['', '', '', '']);
        setReferencePt('');

        setShowModal(true);
    };

    const openEditModal = (question: Question) => {
        setEditingQuestion(question);
        const cat = categories.find((c) => c.name === question.category);
        setCategoryId(cat?.id || null);
        setQuestionText(question.question);
        setOptions(question.options);
        setAnswer(question.answer);
        setReference(question.reference || '');
        setPoints(question.points.toString());
        setPoints(question.points.toString());

        // Load EN
        setQuestionEn(question.question_en || '');
        setAnswerEn(question.answer_en || '');
        setOptionsEn(question.options_en && question.options_en.length === 4 ? question.options_en : ['', '', '', '']);
        setReferenceEn(question.reference_en || '');

        // Load PT
        setQuestionPt(question.question_pt || '');
        setAnswerPt(question.answer_pt || '');
        setOptionsPt(question.options_pt && question.options_pt.length === 4 ? question.options_pt : ['', '', '', '']);
        setReferencePt(question.reference_pt || '');

        setShowModal(true);
    };

    const handleSave = async () => {
        if (!categoryId || !questionText.trim() || !answer.trim()) {
            Alert.alert('Error', 'Todos los campos son requeridos');
            return;
        }

        const filledOptions = options.filter((o) => o.trim());
        if (filledOptions.length < 4) {
            Alert.alert('Error', 'Se requieren 4 opciones de respuesta');
            return;
        }

        if (!filledOptions.includes(answer.trim())) {
            Alert.alert('Error', 'La respuesta correcta debe ser una de las opciones');
            return;
        }

        const selectedCategory = categories.find((c) => c.id === categoryId);
        if (!selectedCategory) return;

        setIsLoading(true);
        try {
            const questionData = {
                category: selectedCategory.name,
                category_id: categoryId,
                question: questionText.trim(),
                options: filledOptions,
                answer: answer.trim(),
                reference: reference.trim(),
                points: parseInt(points) || 100,
                // Translations
                question_en: questionEn.trim() || null,
                answer_en: answerEn.trim() || null,
                options_en: optionsEn.filter(o => o.trim()).length > 0 ? optionsEn : null,
                reference_en: referenceEn.trim() || null,
                question_pt: questionPt.trim() || null,
                answer_pt: answerPt.trim() || null,
                options_pt: optionsPt.filter(o => o.trim()).length > 0 ? optionsPt : null,
                reference_pt: referencePt.trim() || null,
            };

            if (editingQuestion) {
                const { error } = await supabase
                    .from('questions')
                    .update(questionData)
                    .eq('id', editingQuestion.id);
                if (error) throw error;
            } else {
                const { error } = await supabase.from('questions').insert(questionData);
                if (error) throw error;
            }

            await loadQuestions();
            setShowModal(false);
        } catch (error: any) {
            Alert.alert('Error', error.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDownloadTemplate = async () => {
        setIsLoading(true);
        try {
            const XLSX = await import('xlsx');
            // Headers matching our schema for multi-language support
            const data = [
                [
                    'Categoria', 'Puntos',
                    'Pregunta_ES', 'Respuesta_ES', 'Opcion1_ES', 'Opcion2_ES', 'Opcion3_ES', 'Opcion4_ES', 'Referencia_ES',
                    'Pregunta_EN', 'Respuesta_EN', 'Opcion1_EN', 'Opcion2_EN', 'Opcion3_EN', 'Opcion4_EN', 'Referencia_EN',
                    'Pregunta_PT', 'Respuesta_PT', 'Opcion1_PT', 'Opcion2_PT', 'Opcion3_PT', 'Opcion4_PT', 'Referencia_PT'
                ],
                [
                    'Antiguo Testamento', '100',
                    '¿Quién construyó el arca?', 'Noé', 'Noé', 'Moisés', 'Abraham', 'David', 'Génesis 6',
                    'Who built the ark?', 'Noah', 'Noah', 'Moses', 'Abraham', 'David', 'Genesis 6',
                    'Quem construiu a arca?', 'Noé', 'Noé', 'Moisés', 'Abraão', 'Davi', 'Gênesis 6'
                ],
            ];

            const ws = XLSX.utils.aoa_to_sheet(data);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, "Plantilla");

            XLSX.writeFile(wb, "plantilla_preguntas_multilingue.xlsx");
        } catch (error) {
            console.error("Error loading XLSX:", error);
            Alert.alert("Error", "No se pudo cargar la librería de Excel");
        } finally {
            setIsLoading(false);
        }
    };

    const handleImport = async () => {
        console.log('--- Handle Import Started ---');
        // Alert.alert('Debug', 'Botón presionado. Iniciando selector...'); // Uncomment if needed, but console should show.

        try {
            console.log('Launching DocumentPicker...');
            const result = await DocumentPicker.getDocumentAsync({
                type: '*/*', // Allow all types temporarily to rule out MIME issues
                copyToCacheDirectory: true,
            });

            if (result.canceled) {
                console.log('Import canceled by user');
                return;
            }

            console.log('Document Picker Result:', result);
            setIsLoading(true);

            const asset = result.assets ? result.assets[0] : null;
            if (!asset) {
                Alert.alert('Error', 'No asset found in selection');
                setIsLoading(false);
                return;
            }


            console.log('Processing asset:', asset);
            let data: any;

            // Dynamic Import
            const XLSX = await import('xlsx');

            if (Platform.OS === 'web') {
                try {
                    console.log('Fetching file from URI:', asset.uri);
                    const response = await fetch(asset.uri);
                    console.log('Fetch response status:', response.status);
                    const blob = await response.blob();
                    console.log('Blob size:', blob.size);
                    const arrayBuffer = await blob.arrayBuffer();
                    console.log('ArrayBuffer byteLength:', arrayBuffer.byteLength);
                    const workbook = XLSX.read(arrayBuffer, { type: 'array' });
                    const sheetName = workbook.SheetNames[0];
                    console.log('Sheet Name:', sheetName);
                    data = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);
                    console.log('Parsed Data Rows:', data.length);
                } catch (webError: any) {
                    console.error('Web Import Error:', webError);
                    Alert.alert('Error Web', 'Detalles: ' + webError.message);
                    setIsLoading(false);
                    return;
                }
            } else {
                const response = await fetch(asset.uri);
                const blob = await response.blob();
                // @ts-ignore
                const arrayBuffer = await new Response(blob).arrayBuffer();
                const workbook = XLSX.read(arrayBuffer, { type: 'array' });
                const sheetName = workbook.SheetNames[0];
                data = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);
            }

            console.log('Imported Data:', data);

            let count = 0;
            const errors: string[] = [];

            for (let i = 0; i < data.length; i++) {
                const row = data[i];

                // Basic validation: Check Category and Spanish (Base) Question
                if (!row.Pregunta_ES || !row.Respuesta_ES || !row.Categoria) {
                    errors.push(`Fila ${i + 2}: Faltan datos obligatorios (ES).`);
                    continue;
                }

                const catName = row.Categoria.toString().trim();
                const matchedCat = categories.find(c => c.name.toLowerCase() === catName.toLowerCase());

                if (!matchedCat) {
                    errors.push(`Fila ${i + 2}: Categoría '${catName}' no existe.`);
                    continue;
                }

                // Helper to extract options
                const getOptions = (lang: string) => {
                    return [
                        row[`Opcion1_${lang}`]?.toString() || '',
                        row[`Opcion2_${lang}`]?.toString() || '',
                        row[`Opcion3_${lang}`]?.toString() || '',
                        row[`Opcion4_${lang}`]?.toString() || ''
                    ].filter(o => o);
                };

                const optionsES = getOptions('ES');
                const optionsEN = getOptions('EN');
                const optionsPT = getOptions('PT');

                // Validate Spanish options (Mandatory)
                if (!optionsES.includes(row.Respuesta_ES.toString())) {
                    errors.push(`Fila ${i + 2}: La respuesta (ES) no coincide con ninguna opción.`);
                    continue;
                }

                // Prepare Data Object with Translations
                const questionData = {
                    category: matchedCat.name,
                    category_id: matchedCat.id,
                    points: parseInt(row.Puntos) || 100,
                    // Spanish (Default)
                    question: row.Pregunta_ES.toString(),
                    answer: row.Respuesta_ES.toString(),
                    options: optionsES,
                    reference: row.Referencia_ES?.toString() || row.Referencia?.toString() || '',
                    // English
                    question_en: row.Pregunta_EN?.toString() || row.Pregunta_ES.toString(), // Fallback to ES if missing
                    answer_en: row.Respuesta_EN?.toString() || row.Respuesta_ES.toString(),
                    options_en: optionsEN.length > 0 ? optionsEN : optionsES,
                    reference_en: row.Referencia_EN?.toString() || row.Referencia_ES?.toString(),
                    // Portuguese
                    question_pt: row.Pregunta_PT?.toString() || row.Pregunta_ES.toString(),
                    answer_pt: row.Respuesta_PT?.toString() || row.Respuesta_ES.toString(),
                    options_pt: optionsPT.length > 0 ? optionsPT : optionsES,
                    reference_pt: row.Referencia_PT?.toString() || row.Referencia_ES?.toString(),
                };

                const { error } = await supabase.from('questions').insert(questionData);
                if (error) {
                    errors.push(`Fila ${i + 2}: Error BD - ${error.message}`);
                } else {
                    count++;
                }
            }

            if (count > 0) {
                await loadQuestions();
                Alert.alert('Importación Completada', `Se importaron ${count} preguntas correctamente.\n${errors.length > 0 ? '\nErrores:\n' + errors.slice(0, 5).join('\n') : ''}`);
            } else {
                Alert.alert('Error en Importación', errors.length > 0 ? errors.join('\n') : 'No se encontraron preguntas validas.');
            }

        } catch (error: any) {
            console.error('General Import Error:', error);
            Alert.alert('Error', 'Falló la importación: ' + (error.message || error));
        } finally {
            setIsLoading(false);
        }
    };

    const performDelete = async (question: Question) => {
        try {
            const { error } = await supabase
                .from('questions')
                .delete()
                .eq('id', question.id);
            if (error) throw error;
            await loadQuestions();
        } catch (error: any) {
            Alert.alert('Error', error.message);
        }
    };

    const handleDelete = async (question: Question) => {
        if (Platform.OS === 'web') {
            if (window.confirm('¿Estás seguro de eliminar esta pregunta?')) {
                await performDelete(question);
            }
        } else {
            Alert.alert(
                'Eliminar Pregunta',
                `¿Estás seguro de eliminar esta pregunta?`,
                [
                    { text: 'Cancelar', style: 'cancel' },
                    {
                        text: 'Eliminar',
                        style: 'destructive',
                        onPress: () => performDelete(question),
                    },
                ]
            );
        }
    };

    const updateOption = (index: number, value: string) => {
        const newOptions = [...options];
        newOptions[index] = value;
        setOptions(newOptions);
    };

    const updateOptionEn = (index: number, value: string) => {
        const newOptions = [...optionsEn];
        newOptions[index] = value;
        setOptionsEn(newOptions);
    };

    const updateOptionPt = (index: number, value: string) => {
        const newOptions = [...optionsPt];
        newOptions[index] = value;
        setOptionsPt(newOptions);
    };

    const renderQuestion = ({ item }: { item: Question }) => (
        <View style={styles.questionItem}>
            <View style={styles.questionHeader}>
                <Text style={styles.questionCategory}>{item.category}</Text>
                <Text style={styles.questionPoints}>{item.points} pts</Text>
            </View>
            <Text style={styles.questionText} numberOfLines={2}>
                {item.question}
            </Text>
            <View style={styles.questionActions}>
                <TouchableOpacity
                    style={[styles.actionButton, styles.editButton]}
                    onPress={() => openEditModal(item)}
                >
                    <Text style={styles.actionButtonText}>✏️ Editar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.actionButton, styles.deleteButton]}
                    onPress={() => handleDelete(item)}
                >
                    <Text style={styles.actionButtonText}>🗑️</Text>
                </TouchableOpacity>
            </View>
        </View>
    );

    return (
        <LinearGradient colors={['#1a1a2e', '#16213e']} style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Text style={styles.backButtonText}>← Volver</Text>
                </TouchableOpacity>
                <View>
                    <Text style={styles.title}>❓ Preguntas ({filteredQuestions.length})</Text>
                </View>
                <TouchableOpacity style={styles.addButton} onPress={openAddModal}>
                    <LinearGradient colors={['#4CAF50', '#45A049']} style={styles.addButtonGradient}>
                        <Text style={styles.addButtonText}>+ Nueva</Text>
                    </LinearGradient>
                </TouchableOpacity>
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'flex-end', paddingHorizontal: 20, marginBottom: 15, gap: 10 }}>
                <TouchableOpacity onPress={handleDownloadTemplate} style={{ padding: 8 }}>
                    <Text style={{ color: '#aaa', textDecorationLine: 'underline', fontSize: 12 }}>Descargar Plantilla Excel</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={handleImport} style={{ padding: 8, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 8 }}>
                    <Text style={{ color: '#FFD700', fontSize: 12 }}>📤 Importar Excel</Text>
                </TouchableOpacity>
            </View>

            {/* Category Filter */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterContainer}>
                <TouchableOpacity
                    style={[styles.filterChip, !selectedCategoryFilter && styles.filterChipActive]}
                    onPress={() => setSelectedCategoryFilter(null)}
                >
                    <Text style={styles.filterChipText}>Todas</Text>
                </TouchableOpacity>
                {categories.map((cat) => (
                    <TouchableOpacity
                        key={cat.id}
                        style={[styles.filterChip, selectedCategoryFilter === cat.id && styles.filterChipActive]}
                        onPress={() => setSelectedCategoryFilter(cat.id)}
                    >
                        <Text style={styles.filterChipText}>{cat.icon} {cat.name}</Text>
                    </TouchableOpacity>
                ))}
            </ScrollView>

            {isLoading ? (
                <ActivityIndicator size="large" color="#FFD700" style={{ marginTop: 50 }} />
            ) : (
                <FlatList
                    data={filteredQuestions}
                    renderItem={renderQuestion}
                    keyExtractor={(item) => item.id.toString()}
                    contentContainerStyle={styles.list}
                    ListEmptyComponent={
                        <Text style={styles.emptyText}>No hay preguntas. ¡Agrega una!</Text>
                    }
                />
            )}

            <Modal visible={showModal} transparent animationType="fade">
                <View style={styles.modalOverlay}>
                    <ScrollView contentContainerStyle={styles.modalScrollContent}>
                        <View style={styles.modalContent}>
                            <Text style={styles.modalTitle}>
                                {editingQuestion ? 'Editar Pregunta' : 'Nueva Pregunta'}
                            </Text>

                            {/* Category Selector */}
                            <Text style={styles.label}>Categoría:</Text>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                                {categories.map((cat) => (
                                    <TouchableOpacity
                                        key={cat.id}
                                        style={[styles.catChip, categoryId === cat.id && styles.catChipActive]}
                                        onPress={() => setCategoryId(cat.id)}
                                    >
                                        <Text style={styles.catChipText}>{cat.icon} {cat.name}</Text>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>

                            {/* Question */}
                            <Text style={styles.label}>Pregunta:</Text>
                            <TextInput
                                style={[styles.input, styles.textArea]}
                                value={questionText}
                                onChangeText={setQuestionText}
                                placeholder="Escribe la pregunta..."
                                placeholderTextColor="#999"
                                multiline
                                numberOfLines={3}
                            />

                            {/* Options */}
                            <Text style={styles.label}>Opciones (4):</Text>
                            {options.map((opt, idx) => (
                                <TextInput
                                    key={idx}
                                    style={styles.input}
                                    value={opt}
                                    onChangeText={(v) => updateOption(idx, v)}
                                    placeholder={`Opción ${idx + 1}`}
                                    placeholderTextColor="#999"
                                />
                            ))}

                            {/* Answer */}
                            <Text style={styles.label}>Respuesta Correcta:</Text>
                            <TextInput
                                style={styles.input}
                                value={answer}
                                onChangeText={setAnswer}
                                placeholder="Debe coincidir con una opción"
                                placeholderTextColor="#999"
                            />

                            {/* Reference */}
                            <Text style={styles.label}>Cita Bíblica / Referencia (Opcional):</Text>
                            <TextInput
                                style={styles.input}
                                value={reference}
                                onChangeText={setReference}
                                placeholder="Ej: Juan 3:16"
                                placeholderTextColor="#999"
                            />

                            {/* Points */}
                            <Text style={styles.label}>Puntos:</Text>
                            <View style={styles.pointsRow}>
                                {['100', '200', '300', '400', '500'].map((p) => (
                                    <TouchableOpacity
                                        key={p}
                                        style={[styles.pointChip, points === p && styles.pointChipActive]}
                                        onPress={() => setPoints(p)}
                                    >
                                        <Text style={styles.pointChipText}>{p}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>



                            {/* --- ENGLISH SECTION --- */}
                            <Text style={[styles.sectionTitle, { marginTop: 25 }]}>🇬🇧 English (Optional)</Text>
                            <Text style={styles.label}>Question (EN):</Text>
                            <TextInput
                                style={[styles.input, styles.textArea]}
                                value={questionEn}
                                onChangeText={setQuestionEn}
                                placeholder="Question in English..."
                                placeholderTextColor="#999"
                                multiline
                                numberOfLines={2}
                            />
                            <Text style={styles.label}>Answer (EN):</Text>
                            <TextInput
                                style={styles.input}
                                value={answerEn}
                                onChangeText={setAnswerEn}
                                placeholder="Answer in English"
                                placeholderTextColor="#999"
                            />
                            <Text style={styles.label}>Options (EN):</Text>
                            {optionsEn.map((opt, idx) => (
                                <TextInput
                                    key={`en-opt-${idx}`}
                                    style={styles.input}
                                    value={opt}
                                    onChangeText={(v) => updateOptionEn(idx, v)}
                                    placeholder={`Option ${idx + 1} (EN)`}
                                    placeholderTextColor="#999"
                                />
                            ))}
                            <Text style={styles.label}>Reference (EN):</Text>
                            <TextInput
                                style={styles.input}
                                value={referenceEn}
                                onChangeText={setReferenceEn}
                                placeholder="Bible Reference (e.g. John 3:16)"
                                placeholderTextColor="#999"
                            />


                            {/* --- PORTUGUESE SECTION --- */}
                            <Text style={[styles.sectionTitle, { marginTop: 25 }]}>🇧🇷 Português (Opcional)</Text>
                            <Text style={styles.label}>Pregunta (PT):</Text>
                            <TextInput
                                style={[styles.input, styles.textArea]}
                                value={questionPt}
                                onChangeText={setQuestionPt}
                                placeholder="Pergunta em Português..."
                                placeholderTextColor="#999"
                                multiline
                                numberOfLines={2}
                            />
                            <Text style={styles.label}>Resposta (PT):</Text>
                            <TextInput
                                style={styles.input}
                                value={answerPt}
                                onChangeText={setAnswerPt}
                                placeholder="Resposta em Português"
                                placeholderTextColor="#999"
                            />
                            <Text style={styles.label}>Opções (PT):</Text>
                            {optionsPt.map((opt, idx) => (
                                <TextInput
                                    key={`pt-opt-${idx}`}
                                    style={styles.input}
                                    value={opt}
                                    onChangeText={(v) => updateOptionPt(idx, v)}
                                    placeholder={`Opção ${idx + 1} (PT)`}
                                    placeholderTextColor="#999"
                                />
                            ))}
                            <Text style={styles.label}>Referência (PT):</Text>
                            <TextInput
                                style={styles.input}
                                value={referencePt}
                                onChangeText={setReferencePt}
                                placeholder="Referência Bíblica (ex: João 3:16)"
                                placeholderTextColor="#999"
                            />


                            <View style={styles.modalActions}>
                                <TouchableOpacity style={styles.cancelButton} onPress={() => setShowModal(false)}>
                                    <Text style={styles.cancelButtonText}>Cancelar</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.saveButton} onPress={handleSave} disabled={isLoading}>
                                    <LinearGradient colors={['#FFD700', '#FFA500']} style={styles.saveButtonGradient}>
                                        {isLoading ? (
                                            <ActivityIndicator color="#000" />
                                        ) : (
                                            <Text style={styles.saveButtonText}>Guardar</Text>
                                        )}
                                    </LinearGradient>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </ScrollView>
                </View>
            </Modal>
        </LinearGradient>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom: 15,
    },
    backButton: {
        padding: 5,
        marginRight: 10,
    },
    backButtonText: {
        color: '#FFD700',
        fontSize: 16,
        fontWeight: 'bold',
    },
    title: { fontSize: 22, fontWeight: 'bold', color: '#FFD700' },
    addButton: { borderRadius: 20, overflow: 'hidden' },
    addButtonGradient: { paddingVertical: 10, paddingHorizontal: 18 },
    addButtonText: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 14 },
    filterContainer: {
        paddingHorizontal: 15,
        marginBottom: 20,    // Increased margin
        height: 40,          // Reduced height to 40 as requested
        flexGrow: 0,         // Prevent growing
        flexShrink: 0,       // Prevent shrinking
    },
    filterChip: {
        backgroundColor: 'rgba(255,255,255,0.1)',
        paddingHorizontal: 15,
        paddingVertical: 8,
        borderRadius: 20,
        marginRight: 10,
    },
    filterChipActive: { backgroundColor: 'rgba(255,215,0,0.3)', borderWidth: 1, borderColor: '#FFD700' },
    filterChipText: { color: '#FFFFFF', fontSize: 14 },
    list: { padding: 15 },
    questionItem: {
        backgroundColor: 'rgba(255,255,255,0.08)',
        borderRadius: 12,
        padding: 15,
        marginBottom: 12,
    },
    questionHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
    questionCategory: { color: '#FFD700', fontWeight: '600', fontSize: 12 },
    questionPoints: { color: '#4CAF50', fontWeight: 'bold', fontSize: 12 },
    questionText: { color: '#FFFFFF', fontSize: 15, marginBottom: 10 },
    questionActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10 },
    actionButton: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8 },
    editButton: { backgroundColor: 'rgba(100, 181, 246, 0.3)' },
    deleteButton: { backgroundColor: 'rgba(239, 83, 80, 0.3)' },
    actionButtonText: { color: '#FFFFFF', fontSize: 13 },
    emptyText: { color: '#999', textAlign: 'center', marginTop: 50, fontSize: 16 },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.9)',
        justifyContent: 'center',
        padding: 15,
    },
    modalScrollContent: { paddingVertical: 20 },
    modalContent: {
        backgroundColor: '#1a1a2e',
        borderRadius: 20,
        padding: 20,
        borderWidth: 2,
        borderColor: '#FFD700',
    },
    modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#FFD700', marginBottom: 15, textAlign: 'center' },
    label: { color: '#FFFFFF', marginBottom: 8, marginTop: 12, fontSize: 14 },
    input: {
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderRadius: 10,
        padding: 12,
        fontSize: 15,
        color: '#FFFFFF',
        marginBottom: 8,
        borderWidth: 1,
        borderColor: 'rgba(255,215,0,0.2)',
    },
    textArea: { minHeight: 80, textAlignVertical: 'top' },
    catChip: {
        backgroundColor: 'rgba(255,255,255,0.1)',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 15,
        marginRight: 8,
    },
    catChipActive: { backgroundColor: 'rgba(255,215,0,0.3)', borderWidth: 1, borderColor: '#FFD700' },
    catChipText: { color: '#FFFFFF', fontSize: 13 },
    pointsRow: { flexDirection: 'row', gap: 8, marginTop: 5 },
    pointChip: {
        backgroundColor: 'rgba(255,255,255,0.1)',
        paddingHorizontal: 18,
        paddingVertical: 10,
        borderRadius: 10,
    },
    pointChipActive: { backgroundColor: 'rgba(76, 175, 80, 0.4)', borderWidth: 1, borderColor: '#4CAF50' },
    pointChipText: { color: '#FFFFFF', fontWeight: 'bold' },
    modalActions: { flexDirection: 'row', gap: 15, marginTop: 20 },
    cancelButton: { flex: 1, paddingVertical: 15, alignItems: 'center' },
    cancelButtonText: { color: '#999', fontSize: 16 },
    saveButton: { flex: 1, borderRadius: 12, overflow: 'hidden' },
    saveButtonGradient: { paddingVertical: 15, alignItems: 'center' },
    saveButtonText: { color: '#000', fontSize: 16, fontWeight: 'bold' },
    sectionTitle: {
        color: '#FFD700',
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 10,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255, 215, 0, 0.3)',
        paddingBottom: 5,
    },
});
