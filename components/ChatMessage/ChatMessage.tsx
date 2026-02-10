import { RoleType } from '@/models/Chat';
import { Colors } from '@/utils/palette';
import React from 'react';
import { Dimensions, StyleSheet } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import TextElement from '../Reuseable/TextElement';

interface ChatItemMessagePropsType {
  item: any;
  isUser: boolean;
}

const ChatItemMessage: React.FC<ChatItemMessagePropsType> = ({
  item,
  isUser,
}) => {
  const customStyles = {
    ...styles.labelRole,
    alignSelf: isUser ? 'flex-start' : 'flex-end',
    backgroundColor: isUser ? Colors.secondary : Colors.primary,
  };

  return (
    <Animated.View
      entering={FadeInUp.duration(350)}
      style={styles.itemContainer}
    >
      <TextElement cStyles={customStyles}>
        {item.role === RoleType.AGENT ? 'Agent' : 'User'}
      </TextElement>
      <TextElement cStyles={{ alignSelf: isUser ? 'flex-start' : 'flex-end' }}>
        {item.content}
      </TextElement>
    </Animated.View>
  );
};

export default ChatItemMessage;

const styles = StyleSheet.create({
  itemContainer: {
    paddingHorizontal: '4%',
    justifyContent: 'center',
    minHeight: 40,
    width: Dimensions.get('window').width * 0.85,
    marginVertical: 2,
    borderRadius: 8,
    paddingVertical: '4%',
  },
  labelRole: {
    fontSize: 10,
    paddingVertical: '1%',
    paddingHorizontal: '4%',
    borderRadius: 4,
    color: 'white',
    marginBottom: '4%',
  },
});
