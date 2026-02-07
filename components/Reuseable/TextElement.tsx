import { Colors } from '@/utils/palette';
import React from 'react';
import { StyleSheet, Text } from 'react-native';

interface TextElementPropsType {
  children: React.ReactNode;
  cStyles?: {};
}

const TextElement: React.FC<TextElementPropsType> = ({
  children,
  cStyles = {},
}) => {
  return <Text style={[styles.text, cStyles]}>{children}</Text>;
};

const styles = StyleSheet.create({
  text: {
    color: Colors.white,
  },
});

export default TextElement;
