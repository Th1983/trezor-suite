import React from 'react';
import { TouchableOpacity, TouchableOpacityProps, View } from 'react-native';
import { BaseListItem } from './listItemTypes';
import { Icon } from '@trezor/icons';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import { ListItemIcon } from './ListItemIcon';
import { ListItemText } from './ListItemText';
import { Box } from '../Box';

export interface ListItemProps
    extends BaseListItem,
        Omit<TouchableOpacityProps, 'style' | 'onPress'> {
    hasRightArrow?: boolean;
}

const listItemRightArrowContainerStyle = prepareNativeStyle(utils => ({
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: utils.spacings.medium,
}));

export const ListItem = ({
    iconName,
    title,
    subtitle,
    style,
    onPress,
    hasRightArrow = false,
    isTextTruncated = false,
    ...props
}: ListItemProps) => {
    const { applyStyle } = useNativeStyles();

    return (
        <TouchableOpacity disabled={!onPress} onPress={onPress} {...props}>
            <Box style={style} flexDirection="row">
                {iconName && <ListItemIcon iconName={iconName} />}
                <ListItemText title={title} subtitle={subtitle} isTextTruncated={isTextTruncated} />
                {hasRightArrow && (
                    <View style={applyStyle(listItemRightArrowContainerStyle)}>
                        <Icon name="chevronRight" color="gray400" />
                    </View>
                )}
            </Box>
        </TouchableOpacity>
    );
};
