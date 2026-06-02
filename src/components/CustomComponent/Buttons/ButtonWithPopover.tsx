import React from 'react';
import Dropdown, {
	DropdownItem,
	DropdownMenu,
	DropdownToggle,
} from '../../bootstrap/Dropdown';
import Button from '../../bootstrap/Button';

const ButtonWithPopover = ({
	addModalShow,
	addBulkModalShow,
	buttonName,
	onTemplateDownload,
	onInstructionsDownload,
}: any) => {
	return (
		<Dropdown isButtonGroup >
			<Button color='secondary' isLight icon='Add' onClick={() => addModalShow(true)}>
				{buttonName||"Add New"}
			</Button>
			<DropdownToggle>
				<Button color='secondary' isLight isVisuallyHidden />
			</DropdownToggle>
			<DropdownMenu isAlignmentEnd>
				<DropdownItem>
					<Button onClick={() => addBulkModalShow(true)}>Bulk Upload</Button>
				</DropdownItem>
				{onTemplateDownload && (
					<DropdownItem>
						<Button onClick={onTemplateDownload}>Download Template</Button>
					</DropdownItem>
				)}
				{onInstructionsDownload && (
					<DropdownItem>
						<Button onClick={onInstructionsDownload}>Download Instructions</Button>
					</DropdownItem>
				)}
			</DropdownMenu>
		</Dropdown>
	);
};

export default ButtonWithPopover;
