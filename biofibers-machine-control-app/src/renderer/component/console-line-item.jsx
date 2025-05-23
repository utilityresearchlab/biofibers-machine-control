import * as React from "react";

import ListItem from "@mui/material/ListItem";
import ListItemText from "@mui/material/ListItemText";
import Typography from "@mui/material/Typography";

import * as TimeUtil from "../lib/time";
import { ConsoleDataType } from "../lib/console-data";


class ConsoleLineItem extends React.Component {
	constructor(props) {
		super(props);
		// do nothing
	}

	// See text colors on: https://mui.com/system/palette/
	getColorStyle(dataType) {
		let textColor = "primary.main";
		switch (dataType) {
			case ConsoleDataType.ERROR:
				textColor = "error.main";
				break;
			case ConsoleDataType.SENT:
				textColor = "text.primary"
				break;
			case ConsoleDataType.RECEIVED:
				textColor = "success.main";
				break;
			case ConsoleDataType.RECEIVED_STATUS:
				textColor = "success.main";
				break;
			case ConsoleDataType.INFO:
				textColor = "info.main";
				break;
			case ConsoleDataType.UNDEFINED:
				textColor = "warning.main";
				break;
			default:
				textColor = "info";
				break;
		}
		return textColor;
	}

	render() {
		const props = this.props;
		const {text, timestamp, id, dataType, fontSize} = props;
		const formattedTime = TimeUtil.getReadableTimeOfDay(timestamp, true);
		const colorStyle = this.getColorStyle(dataType);
		return (
			<ListItem
				alignItems="flex-start"
				key={id}
				sx={{paddingTop: '0', paddingBottom: '0'}}>
				<ListItemText
					key={id + "-1"}
					disableTypography
					primary={
						<Typography
							style={{fontFamily: 'monospace', fontSize: fontSize}}
							color={colorStyle}>
								{"[" + formattedTime + "] > " + text }
						</Typography>}
					/>
			</ListItem>
		);
	}
}

export default ConsoleLineItem;
