import React, { Component, ReactNode, ErrorInfo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  errorText: string;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, errorText: '' };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, errorText: error.message || 'حدث خطأ غير متوقع' };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('App Crash intercepted by ErrorBoundary:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.container}>
          <Text style={styles.title}>عذراً، حدث خطأ أثناء تشغيل اللعبة!</Text>
          <Text style={styles.desc}>{this.state.errorText}</Text>
          <TouchableOpacity
            style={styles.btn}
            onPress={() => this.setState({ hasError: false, errorText: '' })}
          >
            <Text style={styles.btnText}>إعادة المحاولة</Text>
          </TouchableOpacity>
        </View>
      );
    }
    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B0F19',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    color: '#FFD700',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  desc: {
    color: '#94A3B8',
    fontSize: 14,
    marginBottom: 20,
    textAlign: 'center',
  },
  btn: {
    backgroundColor: '#FFD700',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  btnText: {
    color: '#0B0F19',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
