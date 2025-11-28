import React from 'react';
import { View, Image, Text } from '@tarojs/components';
import './index.scss';

interface EmptyProps {
  icon?: string;
  text?: string;
  description?: string;
  children?: React.ReactNode;
}

const Empty: React.FC<EmptyProps> = ({ 
  icon, 
  text = '暂无数据', 
  description,
  children 
}) => {
  return (
    <View className='empty-container'>
      {icon && (
        <Image 
          className='empty-icon' 
          src={icon} 
          mode='aspectFit'
        />
      )}
      {!icon && (
        <View className='empty-icon-default'>
          <Text className='empty-icon-text'>📦</Text>
        </View>
      )}
      <View className='empty-text'>{text}</View>
      {description && (
        <View className='empty-description'>{description}</View>
      )}
      {children && (
        <View className='empty-action'>
          {children}
        </View>
      )}
    </View>
  );
};

export default Empty;
