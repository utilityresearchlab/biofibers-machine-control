import * as React from "react";


import Box from '@mui/material/Box';
import ButtonGroup from "@mui/material/ButtonGroup";

import Divider from '@mui/material/Divider';
import List from '@mui/material/List';

import ToggleButton from "@mui/material/ToggleButton";
import Tooltip from "@mui/material/Tooltip";


import InsightsIcon from '@mui/icons-material/Insights';
import KeyboardDoubleArrowDownIcon from '@mui/icons-material/KeyboardDoubleArrowDown';
import OutboxIcon from '@mui/icons-material/Outbox';

import ConsoleLineItem from "./console-line-item";
import { ConsoleDataType } from "../lib/console-data";
import { Stack } from "@mui/material";

class Console extends React.Component {

	constructor(props) {
		super(props);
		this.state = {
			shouldScroll: true,
			showSendEvents: true,
			showReceivedStatusEvents: false,
		};
		this.refConsole = React.createRef();
		this.toggleShouldScroll = this.toggleShouldScroll.bind(this);
		this.toggleShowSendEvents = this.toggleShowSendEvents.bind(this);
		this.toggleShowReceivedStatusEvents = this.toggleShowReceivedStatusEvents.bind(this);
	}

	componentDidMount() {
		if (this.state.shouldScroll) {
			this.scrollToEnd();
		}
	}

	componentDidUpdate() {
		if (this.state.shouldScroll) {
			this.scrollToEnd();
		}
	}

	scrollToEnd() {
		this.refConsole.current.scrollTop = this.refConsole.current.scrollHeight;
	}

	toggleShouldScroll() {
		const shouldScroll = !this.state.shouldScroll;
		this.setState({shouldScroll: shouldScroll });
	}

	toggleShowSendEvents() {
		const showSend = !this.state.showSendEvents;
		this.setState({showSendEvents: showSend });
	}

	toggleShowReceivedStatusEvents() {
		const showReceivedStatus = !this.state.showReceivedStatusEvents;
		this.setState({showReceivedStatusEvents: showReceivedStatus });
	}

	render() {
		const showSendEvents = this.state.showSendEvents;
		const showReceivedStatusEvents = this.state.showReceivedStatusEvents;
		const propsData = this.props.data;
		const consoleFontSize = '0.8rem';
		const filteredData = propsData.filter(item => {
			if (item.dataType === ConsoleDataType.SENT) {
				return showSendEvents;
			} else if (item.dataType === ConsoleDataType.RECEIVED_STATUS) {
				return showReceivedStatusEvents;
			} else {
				return true;
			}
		});
		const listItems = filteredData.map((item, index) => {
			let k = item.timestamp.toString() + "_" + index.toString();
			return (
				<React.Fragment key={k+'-f'}>
					<ConsoleLineItem
						style={{fontFamily: 'monospace', fontSize: consoleFontSize}}
						key={k + "-0"}
						id={k}
						text={item.data}
						timestamp={item.timestamp}
						dataType={item.dataType}
						fontSize={consoleFontSize}
						/>
					<Divider component="li" key={k + "-div"}/>
				</React.Fragment>);
	});

		return (
			<Box variant="div">
				<List
					sx={{
						width: "100%",
						height: 300,
						bgcolor: "#f4f4f4",
						border: "1px solid gray",
						overflow: "auto", 
						fontFamily: 'monotype',
						fontSize: consoleFontSize
					}}
					ref={this.refConsole}>
					{listItems}
				</List>
				<Stack
					direction="row"
					justifyContent="left"
					alignItems="center"
					spacing={0.5}
					paddingTop={0.5}>
				
					<Tooltip title="Auto-Scroll">
						<ToggleButton
							value='scroll'
							size='small'
							variant='contained'
							selected={this.state.shouldScroll}
							onChange={this.toggleShouldScroll}>
							<KeyboardDoubleArrowDownIcon />
						</ToggleButton>
					</Tooltip>
					<Tooltip title="Show Sent Commands">
						<ToggleButton
							value='showSendEvents'
							size='small'
							variant='contained'
							selected={showSendEvents}
							onChange={this.toggleShowSendEvents}>
							<OutboxIcon />
						</ToggleButton>
					</Tooltip>
					<Tooltip title="Show Machine Status">
						<ToggleButton
							value='show'
							size='small'
							variant='contained'
							selected={showReceivedStatusEvents}
							onChange={this.toggleShowReceivedStatusEvents}>
							<InsightsIcon />
						</ToggleButton>
					</Tooltip>
				</Stack>
			</Box>
		);
	}
}

export default Console;
