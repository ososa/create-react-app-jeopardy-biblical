import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface ErrorBoundaryProps {
    children: React.ReactNode;
}

interface ErrorBoundaryState {
    hasError: boolean;
    error: Error | null;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
    constructor(props: ErrorBoundaryProps) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: Error): ErrorBoundaryState {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        console.error('Error caught by boundary:', error, errorInfo);
    }

    handleRetry = () => {
        this.setState({ hasError: false, error: null });
    };

    render() {
        if (this.state.hasError) {
            return (
                <LinearGradient colors={['#001B3A', '#0D3B66']} style={styles.container}>
                    <View style={styles.content}>
                        <Text style={styles.emoji}>😔</Text>
                        <Text style={styles.title}>¡Algo salió mal!</Text>
                        <Text style={styles.message}>
                            {this.state.error?.message || 'Ha ocurrido un error inesperado'}
                        </Text>
                        <TouchableOpacity style={styles.button} onPress={this.handleRetry}>
                            <LinearGradient
                                colors={['#FFD700', '#FFA500']}
                                style={styles.buttonGradient}
                            >
                                <Text style={styles.buttonText}>🔄 Reintentar</Text>
                            </LinearGradient>
                        </TouchableOpacity>
                    </View>
                </LinearGradient>
            );
        }

        return this.props.children;
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 30,
    },
    emoji: {
        fontSize: 80,
        marginBottom: 20,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#FFD700',
        marginBottom: 15,
        textAlign: 'center',
    },
    message: {
        fontSize: 16,
        color: '#FFFFFF',
        textAlign: 'center',
        marginBottom: 30,
        opacity: 0.8,
    },
    button: {
        borderRadius: 12,
        overflow: 'hidden',
    },
    buttonGradient: {
        paddingVertical: 15,
        paddingHorizontal: 30,
    },
    buttonText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#001B3A',
        textAlign: 'center',
    },
});
