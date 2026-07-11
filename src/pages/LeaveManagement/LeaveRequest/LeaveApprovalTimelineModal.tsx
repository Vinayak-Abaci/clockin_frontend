import React, { useEffect, useMemo, useRef, useState } from 'react';
import Modal, { ModalBody, ModalHeader, ModalTitle } from '../../../components/bootstrap/Modal';
import CustomBadge from '../../../components/CustomComponent/CustomBadge';
import CustomSpinner from '../../../components/CustomSpinner/CustomSpinner';
import Icon from '../../../components/icon/Icon';
import { authAxios } from '../../../axiosInstance';
import useDarkMode from '../../../hooks/useDarkMode';
import useToasterNotification from '../../../hooks/useToasterNotification';
import { statusColorCodes } from '../../../helpers/constants';
import {
	actedByLabel,
	formatActedAt,
	formatApproverType,
	parseApprovalStepsResponse,
	sortApprovalSteps,
	STEP_DOT_COLORS,
	type LeaveApprovalStep,
	type LeaveApprovalStepsMeta,
} from './leaveApprovalStepUtils';

export type LeaveApprovalTimelineContext = {
	leaveRequestId?: number | string;
	employeeName?: string;
	leaveTypeName?: string;
	fromDate?: string;
	toDate?: string;
	overallStatus?: string;
};

type LeaveApprovalTimelineModalProps = {
	isOpen: boolean;
	setIsOpen: (open: boolean) => void;
	context: LeaveApprovalTimelineContext | null;
};

const STEP_ICON: Record<string, string> = {
	APPROVED: 'CheckCircle',
	REJECTED: 'Cancel',
	CANCELLED: 'Cancel',
	PENDING: 'RadioButtonUnchecked',
	SKIPPED: 'RemoveCircleOutline',
};

const labelStyle = (muted: string) => ({
	fontSize: '0.7rem',
	fontWeight: 600,
	letterSpacing: '0.06em',
	textTransform: 'uppercase' as const,
	color: muted,
	marginBottom: 4,
});

const LeaveApprovalTimelineModal = ({
	isOpen,
	setIsOpen,
	context,
}: LeaveApprovalTimelineModalProps) => {
	const { darkModeStatus } = useDarkMode();
	const { showErrorNotification } = useToasterNotification();
	const showErrorRef = useRef(showErrorNotification);
	showErrorRef.current = showErrorNotification;

	const [steps, setSteps] = useState<LeaveApprovalStep[]>([]);
	const [stepsMeta, setStepsMeta] = useState<LeaveApprovalStepsMeta>({});
	const [loadingSteps, setLoadingSteps] = useState(false);
	const overallStatus = String(context?.overallStatus ?? '').toUpperCase();

	useEffect(() => {
		if (!isOpen || context?.leaveRequestId == null) {
			setSteps([]);
			setStepsMeta({});
			return undefined;
		}

		let cancelled = false;
		setLoadingSteps(true);
		setSteps([]);
		setStepsMeta({});

		authAxios
			.get(`/api/hr/leave-requests/${context.leaveRequestId}/`)
			.then((res) => {
				if (!cancelled) {
					const { steps: parsedSteps, meta } = parseApprovalStepsResponse(res.data);
					setSteps(sortApprovalSteps(parsedSteps));
					setStepsMeta(meta);
				}
			})
			.catch((err) => {
				if (!cancelled) {
					setSteps([]);
					setStepsMeta({});
					showErrorRef.current(err);
				}
			})
			.finally(() => {
				if (!cancelled) setLoadingSteps(false);
			});

		return () => {
			cancelled = true;
		};
	}, [isOpen, context?.leaveRequestId]);

	const textPrimary = darkModeStatus ? '#f8f9fa' : '#111827';
	const textMuted = darkModeStatus ? '#9ca3af' : '#6b7280';
	const textSubtle = darkModeStatus ? '#6b7280' : '#9ca3af';
	const surface = darkModeStatus ? 'rgba(255,255,255,0.06)' : '#f3f4f6';
	const cardBg = darkModeStatus ? 'rgba(255,255,255,0.04)' : '#ffffff';
	const border = darkModeStatus ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)';

	const dateRange = useMemo(() => {
		if (context?.fromDate && context?.toDate) {
			return `${context.fromDate} – ${context.toDate}`;
		}
		return context?.fromDate || context?.toDate || '';
	}, [context?.fromDate, context?.toDate]);

	const modalTitle = context?.employeeName?.trim() || 'Leave request';

	return (
		<Modal
			isOpen={isOpen}
			setIsOpen={setIsOpen}
			size='md'
			isCentered
			isScrollable
			titleId='leave-approval-status'>
			<ModalHeader setIsOpen={setIsOpen}>
				<ModalTitle id='leave-approval-status'>{modalTitle}</ModalTitle>
			</ModalHeader>
			<ModalBody className='pt-3 pb-5 px-4 px-md-5'>
				{(context?.leaveTypeName || dateRange || overallStatus) && (
					<div
						className='rounded-3 p-4 mb-5'
						style={{
							backgroundColor: surface,
							border: `1px solid ${border}`,
						}}>
						<div className='row g-4'>
							{context?.leaveTypeName ? (
								<div className='col-sm-6'>
									<div style={labelStyle(textSubtle)}>Leave type</div>
									<div style={{ color: textPrimary, fontSize: '1rem', fontWeight: 600 }}>
										{context.leaveTypeName}
									</div>
								</div>
							) : null}
							{dateRange ? (
								<div className='col-sm-6'>
									<div style={labelStyle(textSubtle)}>Dates</div>
									<div style={{ color: textPrimary, fontSize: '1rem', fontWeight: 500 }}>
										{dateRange}
									</div>
								</div>
							) : null}
							{overallStatus ? (
								<div className={stepsMeta.currentApprovalLevel != null ? 'col-sm-6' : 'col-12 pt-1'}>
									<div style={labelStyle(textSubtle)}>Request status</div>
									<CustomBadge color={statusColorCodes?.[overallStatus] || '#E4E4E4'}>
										{context?.overallStatus}
									</CustomBadge>
								</div>
							) : null}
						
						</div>
					</div>
				)}

				{loadingSteps ? (
					<div className='d-flex justify-content-center py-5'>
						<CustomSpinner />
					</div>
				) : steps.length === 0 ? (
					<p className='mb-0 text-center py-5' style={{ color: textMuted, fontSize: '0.9rem' }}>
						No approvers configured for this request.
					</p>
				) : (
					<>
						<div style={labelStyle(textSubtle)} className='mb-3'>
							Approvers
						</div>
						<div className='d-flex flex-column' style={{ gap: 20 }}>
							{steps.map((step, index) => {
								const statusKey = String(step?.status ?? '').trim().toUpperCase();
								const isCurrent = Boolean(step?.is_current) && statusKey === 'PENDING';
								const isLast = index === steps.length - 1;
								const color =
									isCurrent && statusKey === 'PENDING'
										? '#f59e0b'
										: STEP_DOT_COLORS[statusKey] || '#d1d5db';
								const icon =
									isCurrent && statusKey === 'PENDING'
										? 'HourglassEmpty'
										: STEP_ICON[statusKey] || 'Circle';
								const actor = actedByLabel(step?.acted_by);
								const approverLabel =
									step?.approver_type_display?.trim() ||
									(step?.approver_type?.trim()
										? formatApproverType(step.approver_type)
										: null) ||
									actor ||
									(step?.level != null ? `Level ${step.level}` : 'Approver');
								const actedAt = formatActedAt(step?.acted_at);
								const lineColor =
									statusKey === 'APPROVED'
										? '#46BCAA'
										: darkModeStatus
											? 'rgba(255,255,255,0.14)'
											: '#e5e7eb';

								return (
									<div key={step?.id ?? `step-${index}`} className='d-flex' style={{ gap: 20 }}>
										<div
											className='d-flex flex-column align-items-center flex-shrink-0'
											style={{ width: 44 }}>
											<div
												className='d-flex align-items-center justify-content-center rounded-circle flex-shrink-0'
												style={{
													width: 44,
													height: 44,
													backgroundColor: `${color}22`,
													border: isCurrent ? `2px solid ${color}` : `1px solid ${border}`,
													boxShadow: isCurrent ? `0 0 0 5px ${color}18` : 'none',
												}}>
												<Icon icon={icon} size='lg' style={{ color }} />
											</div>
											{!isLast ? (
												<div
													style={{
														width: 2,
														flex: 1,
														minHeight: 28,
														marginTop: 12,
														marginBottom: 4,
														borderRadius: 2,
														backgroundColor: lineColor,
													}}
												/>
											) : null}
										</div>

										<div
											className='flex-grow-1 rounded-3 p-4'
											style={{
												minWidth: 0,
												backgroundColor: cardBg,
												border: `1px solid ${isCurrent ? `${color}55` : border}`,
												boxShadow: isCurrent
													? `0 4px 20px ${color}14`
													: darkModeStatus
														? 'none'
														: '0 2px 8px rgba(0,0,0,0.04)',
											}}>
											<div className='d-flex flex-column flex-sm-row justify-content-between align-items-start gap-3'>
												<div style={{ minWidth: 0 }}>
													<div style={labelStyle(textSubtle)}>Approver</div>
													<div
														style={{
															color: textPrimary,
															fontSize: '1.05rem',
															fontWeight: 600,
															lineHeight: 1.4,
														}}>
														{approverLabel}
													</div>
												</div>
												{step?.status ? (
													<div className='flex-shrink-0'>
														<div style={labelStyle(textSubtle)}>Step status</div>
														<CustomBadge
															color={statusColorCodes?.[statusKey] || '#E4E4E4'}>
															{step.status}
														</CustomBadge>
													</div>
												) : null}
											</div>

											{actor || actedAt ? (
												<div className='mt-4 pt-3' style={{ borderTop: `1px solid ${border}` }}>
													<div style={labelStyle(textSubtle)}>Action</div>
													<div style={{ color: textMuted, fontSize: '0.9rem', lineHeight: 1.5 }}>
														{actor ? <span>{actor}</span> : null}
														{actor && actedAt ? <span> · </span> : null}
														{actedAt ? <span>{actedAt}</span> : null}
													</div>
												</div>
											) : isCurrent ? (
												<div className='mt-4 pt-3' style={{ borderTop: `1px solid ${border}` }}>
													<div style={labelStyle(textSubtle)}>Action</div>
													<div style={{ color: textMuted, fontSize: '0.9rem' }}>
														Waiting for response
													</div>
												</div>
											) : null}

											{step?.remarks ? (
												<div className='mt-4 pt-3' style={{ borderTop: `1px solid ${border}` }}>
													<div style={labelStyle(textSubtle)}>Remarks</div>
													<div
														className='rounded-2 p-3 mt-2'
														style={{
															fontSize: '0.9rem',
															color: textMuted,
															lineHeight: 1.55,
															backgroundColor: darkModeStatus
																? 'rgba(255,255,255,0.04)'
																: '#f9fafb',
															border: `1px solid ${border}`,
														}}>
														{step.remarks}
													</div>
												</div>
											) : null}
										</div>
									</div>
								);
							})}
						</div>
					</>
				)}
			</ModalBody>
		</Modal>
	);
};

export default LeaveApprovalTimelineModal;
