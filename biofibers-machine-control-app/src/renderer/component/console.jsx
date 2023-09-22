import * as React from "react";

import ConsoleLineItem from "./console-line-item";

import ButtonGroup from "@mui/material/ButtonGroup";

import Divider from '@mui/material/Divider';
import List from '@mui/material/List';
import ToggleButton from "@mui/material/ToggleButton";
import Tooltip from "@mui/material/Tooltip";


import VerticalAlignBottomIcon from '@mui/icons-material/VerticalAlignBottom';
import KeyboardDoubleArrowDownIcon from '@mui/icons-material/KeyboardDoubleArrowDown';
import OutboxIcon from '@mui/icons-material/Outbox';

import { ConsoleDataType } from "../lib/console-data";

class Console extends React.Component {

	constructor(props) {
		super(props);
		this.state = {
			shouldScroll: true,
			showSendEvents: true,
		};
		this.refConsole = React.createRef();
		this.toggleShouldScroll = this.toggleShouldScroll.bind(this);
		this.toggleShowSendEvents = this.toggleShowSendEvents.bind(this);
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

	render() {
		const showSendEvents = this.state.showSendEvents;
		const propsData = this.props.data;
		const filteredData = propsData.filter(item => {
			if (item.dataType === ConsoleDataType.SENT) {
				return showSendEvents;
			} else {
				return true;
			}
		});
		const listItems = filteredData.map((item, index) => {
			let k = item.timestamp.toString() + "_" + index.toString();
			return (
				<React.Fragment key={k+'-f'}>
					<ConsoleLineItem
						style={{fontFamily: 'monospace'}}
						key={k + "-0"}
						id={k}
						text={item.data}
						timestamp={item.timestamp}
						dataType={item.dataType}
						/>
					<Divider component="li" key={k + "-div"}/>
				</React.Fragment>);
	});

		return (
			<div>
				<List
					sx={{
						width: "100%",
						maxWidth: 560,
						height: 300,
						bgcolor: "background.paper",
						border: "1px solid gray",
						overflow: "auto",
						fontFamily: 'monotype',
						fontSize: '0.9rem',
					}}
					ref={this.refConsole}>
					{listItems}
					<div ></div>
				</List>
				<ButtonGroup variant="outlined" aria-label="outlined button group">
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
							selected={this.state.showSendEvents}
							onChange={this.toggleShowSendEvents}>
							<OutboxIcon />
						</ToggleButton>
					</Tooltip>
				</ButtonGroup>
			</div>
		);
	}
}

export default Console;
