import React from 'react';
import { View } from '@tarojs/components';
import { Loading as NutLoading } from '@nutui/nutui-react-taro';
import './index.scss';

interface LoadingProps {
  fullscreen?: boolean;
  text?: string;
}

const Loading: React.FC<LoadingProps> = ({ 
  fullscreen = false, 
  text = '加载中...'
}) => {
  if (fullscreen) {
    return (
      <View className='loading-fullscreen'>
        <View className='loading-content'>
          <NutLoading type='circular' />
          {text && <View className='loading-text'>{text}</View>}
        </View>
      </View>
    );
  }

  return (
    <View className='loading-inline'>
      <NutLoading type='circular' />
      {text && <View className='loading-text'>{text}</View>}
    </View>
  );
};

export default Loading;
