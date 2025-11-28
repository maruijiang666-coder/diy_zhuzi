import { Component, ErrorInfo, ReactNode } from 'react';
import { View, Text, Button } from '@tarojs/components';
import { logger } from '../../../utils/logger';
import './index.scss';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  static getDerivedStateFromError(): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
    };
  }

  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // 记录错误日志
    logger.error('ErrorBoundary caught an error', error);
    logger.error('Error component stack', errorInfo.componentStack);
  }

  handleReset = (): void => {
    this.setState({
      hasError: false,
    });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      // 如果提供了自定义降级UI，使用它
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // 默认降级UI
      return (
        <View className='error-boundary'>
          <View className='error-boundary-content'>
            <View className='error-icon'>⚠️</View>
            <Text className='error-title'>抱歉，页面出现了问题</Text>
            <Text className='error-message'>
              我们已经记录了这个错误，请稍后重试
            </Text>
            <Button 
              className='error-button' 
              onClick={this.handleReset}
            >
              重新加载
            </Button>
          </View>
        </View>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
