import React, { useState } from 'react';
import PropTypes from 'prop-types';
import moment from 'moment';
import { Col, FormGroup, Label, ButtonGroup } from 'reactstrap';
import Modal, { ModalBody, ModalFooter, ModalHeader, ModalTitle } from '../../bootstrap/Modal';
import Button from '../../bootstrap/Button';
import Spinner from '../../bootstrap/Spinner';
import useToasterNotification from '../../../hooks/useToasterNotification';
import downloadHandler from '../../../helpers/DownloadCsv';
import {
	buildAttendanceEventsExportUrl,
	buildAttendanceExportUrl,
	hrExportFileName,
} from '../../../helpers/hrExportUtils';
import useDarkMode from '../../../hooks/useDarkMode';
const EXPORT_VARIANTS = {
	legacy: 'legacy',
	attendanceEvents: 'attendance-events',
	attendance: 'attendance',
};

const HR_EXPORT_BUILDERS = {
	[EXPORT_VARIANTS.attendanceEvents]: buildAttendanceEventsExportUrl,
	[EXPORT_VARIANTS.attendance]: buildAttendanceExportUrl,
};

const HR_EXPORT_MODAL_TITLES = {
	[EXPORT_VARIANTS.attendanceEvents]: 'Export attendance events',
	[EXPORT_VARIANTS.attendance]: 'Export attendance report',
};

const buildLegacyExportUrl = (listUrl, reportType, startDate, endDate) => {
	let exportUrl = `${listUrl}&report_type=${reportType}`;
	if (startDate && endDate) {
		exportUrl += `&start_date=${startDate}&end_date=${endDate}`;
	}
	return exportUrl;
};

const ExportButton = ({
	url,
	name,
	variant = EXPORT_VARIANTS.legacy,
	hiddenColumnsKey = '',
	modalTitle,
}) => {
	const { darkModeStatus } = useDarkMode();
	const hrExportBuilder = HR_EXPORT_BUILDERS[variant];
	const isHrExport = Boolean(hrExportBuilder);
	const { showErrorNotification } = useToasterNotification();
	const [isLoading, setIsloading] = useState(false);
	const [isModalShow, setIsModalShow] = useState(false);
	const [selectedOption, setSelectedOption] = useState(isHrExport ? 'csv' : 'CSV');
	const [date, setDate] = useState(null);
	const [error, setError] = useState(null);

	const startDateKey = isHrExport ? 'from_date' : 'start_date';
	const endDateKey = isHrExport ? 'to_date' : 'end_date';

	const handleExport = () => {
		const startDate = date?.[startDateKey];
		const endDate = date?.[endDateKey];

		if (!startDate || !endDate) {
			showErrorNotification('Please select a date range');
			return;
		}

		setIsloading(true);

		if (isHrExport) {
			const exportFormat = String(selectedOption).toLowerCase();
			if (exportFormat !== 'csv' && exportFormat !== 'xlsx') {
				showErrorNotification('Invalid export format');
				setIsloading(false);
				return;
			}
			const exportUrl = hrExportBuilder(url.current, {
				exportFormat,
				fromDate: startDate,
				toDate: endDate,
			});
			const fileName = hrExportFileName(name, exportFormat);
			downloadHandler(exportUrl, fileName, setIsloading);
			return;
		}

		const exportUrl = buildLegacyExportUrl(url.current, selectedOption, startDate, endDate);
		downloadHandler(exportUrl, `${name}.csv`, setIsloading);
	};

	const dateChangeHandler = (value, key) => {
		setDate((prev) => {
			const updatedDate = { ...prev, [key]: value };

			if (key === startDateKey) {
				updatedDate[endDateKey] = '';
			}

			if (updatedDate[startDateKey] && updatedDate[endDateKey]) {
				const startDate = moment(updatedDate[startDateKey], 'YYYY-MM-DD');
				const endDate = moment(updatedDate[endDateKey], 'YYYY-MM-DD');
				const diffInDays = endDate.diff(startDate, 'days');

				if (isHrExport && endDate.isBefore(startDate)) {
					setError('End date must be on or after start date.');
					return prev;
				}

				if (!isHrExport && selectedOption === 'PDF' && diffInDays > 14) {
					setError('PDF export allows a maximum date range of 14 days.');
					return prev;
				}

				if (!isHrExport && selectedOption === 'CSV' && diffInDays > 30) {
					setError('CSV export allows a maximum date range of 30 days.');
					return prev;
				}
			}

			setError(null);
			return updatedDate;
		});
	};

	const setQuickRange = (start, end) => {
		setDate({
			[startDateKey]: start,
			[endDateKey]: end,
		});
		setError(null);
	};

	const formatOptions = isHrExport
		? [
				{ value: 'csv', label: 'CSV' },
				{ value: 'xlsx', label: 'XLSX' },
			]
		: [{ value: 'CSV', label: 'CSV' }];

	const canGenerate = Boolean(date?.[startDateKey] && date?.[endDateKey] && !error);
	const resolvedModalTitle =
		modalTitle || HR_EXPORT_MODAL_TITLES[variant] || 'Export report';

	return (
		<>
			<Button
				icon='Download'
				color={darkModeStatus ? 'light' : 'dark'}
				isLight
				isDisable={isLoading}
				onClick={() => setIsModalShow(true)}>
				{isLoading ? <Spinner isSmall color='secondary' /> : 'Export'}
			</Button>

			{isModalShow && (
				<Modal isOpen={isModalShow} setIsOpen={setIsModalShow}>
					<ModalHeader className='p-4' setIsOpen={setIsModalShow}>
						<ModalTitle id='exportmodals'>{resolvedModalTitle}</ModalTitle>
					</ModalHeader>
					<ModalBody className='px-5 pb-2 d-flex flex-column gap-1'>
						<div className='col-12 mb-3'>
							<div className='form-group'>
								<label htmlFor='export-format' className='form-label'>
									{isHrExport ? 'Format *' : 'Type *'}
								</label>
								<div className='d-flex gap-4 align-items-center'>
									{formatOptions.map(({ value, label }) => (
										<div key={value} className='d-flex align-items-center gap-2'>
											<input
												type='radio'
												id={`export-${value}`}
												name='export-format'
												value={value}
												checked={selectedOption === value}
												onChange={() => {
													setSelectedOption(value);
													setDate(null);
													setError(null);
												}}
												className='form-check-input'
											/>
											<label
												htmlFor={`export-${value}`}
												className='form-check-label'
												style={{ marginTop: '4px' }}>
												{label}
											</label>
										</div>
									))}
								</div>
							</div>
						</div>

						<Label>Quick Selection</Label>
						<ButtonGroup className='d-flex gap-2 mb-2'>
							<Button
								color='secondary'
								isLight
								aria-label='Today'
								onFocus={(e) => {
									e.target.style.backgroundColor = '#0D3C76';
									e.target.style.color = 'white';
								}}
								onBlur={(e) => {
									e.target.style.backgroundColor = '';
									e.target.style.color = '';
								}}
								onClick={() => {
									const today = moment().format('YYYY-MM-DD');
									if (isHrExport) {
										setQuickRange(today, today);
									} else {
										setQuickRange(today, moment().add(1, 'days').format('YYYY-MM-DD'));
									}
								}}>
								Today
							</Button>
							{[
								{ label: 'Yesterday', days: 1 },
								{ label: '7 Days', days: 7 },
								{ label: '30 Days', days: 30, disabled: !isHrExport && selectedOption === 'PDF' },
							].map(({ label, days, disabled }) => (
								<Button
									key={label}
									color='secondary'
									isLight
									isDisable={disabled}
									onFocus={(e) => {
										e.target.style.backgroundColor = '#0D3C76';
										e.target.style.color = 'white';
									}}
									onBlur={(e) => {
										e.target.style.backgroundColor = '';
										e.target.style.color = '';
									}}
									onClick={() => {
										setQuickRange(
											moment().subtract(days, 'days').format('YYYY-MM-DD'),
											moment().format('YYYY-MM-DD'),
										);
									}}>
									{label}
								</Button>
							))}
						</ButtonGroup>

						<FormGroup style={{ marginBottom: '5px' }}>
							<Label for='export-start-date'>
								{isHrExport ? 'From date *' : 'Start Date *'}
							</Label>
							<Col>
								<input
									placeholder={isHrExport ? 'From date' : 'Start Date'}
									type='date'
									id='export-start-date'
									className='form-control input-style'
									value={date?.[startDateKey] || ''}
									max={new Date().toISOString().split('T')[0]}
									onChange={(e) => dateChangeHandler(e.target.value, startDateKey)}
								/>
							</Col>
						</FormGroup>
						<FormGroup style={{ marginBottom: '5px' }}>
							<Label for='export-end-date'>
								{isHrExport ? 'To date *' : 'End Date *'}
							</Label>
							<Col>
								<input
									placeholder={isHrExport ? 'To date' : 'End Date'}
									id='export-end-date'
									type='date'
									value={date?.[endDateKey] || ''}
									min={
										date?.[startDateKey]
											? new Date(date[startDateKey]).toISOString().split('T')[0]
											: ''
									}
									max={new Date().toISOString().split('T')[0]}
									disabled={!date?.[startDateKey]}
									className='form-control input-style mb-3'
									onChange={(e) => dateChangeHandler(e.target.value, endDateKey)}
								/>
							</Col>
							{error && (
								<b className='text-danger' style={{ marginTop: '10px' }}>
									{error}
								</b>
							)}
						</FormGroup>
					</ModalBody>
					<ModalFooter className='px-4 pb-4'>
						<Button
							icon='Download'
							style={{ marginRight: '20px', marginTop: '8px' }}
							color='secondary'
							isLight
							isDisable={!canGenerate || isLoading}
							onClick={() => {
								setIsModalShow(false);
								handleExport();
							}}>
							Generate
						</Button>
					</ModalFooter>
				</Modal>
			)}
		</>
	);
};

ExportButton.propTypes = {
	url: PropTypes.shape({ current: PropTypes.string }).isRequired,
	name: PropTypes.string.isRequired,
	variant: PropTypes.oneOf([
		EXPORT_VARIANTS.legacy,
		EXPORT_VARIANTS.attendanceEvents,
		EXPORT_VARIANTS.attendance,
	]),
	hiddenColumnsKey: PropTypes.string,
	modalTitle: PropTypes.string,
};

ExportButton.defaultProps = {
	variant: EXPORT_VARIANTS.legacy,
	hiddenColumnsKey: '',
	modalTitle: undefined,
};

export { EXPORT_VARIANTS };
export default ExportButton;
