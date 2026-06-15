import React, { useEffect, useState } from 'react';
import Chip from '@mui/material/Chip';
import Modal, { ModalBody, ModalFooter, ModalHeader, ModalTitle } from '../../components/bootstrap/Modal';
import Button from '../../components/bootstrap/Button';
import CustomSpinner from '../../components/CustomSpinner/CustomSpinner';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import { authAxios } from '../../axiosInstance';
import useToasterNotification from '../../hooks/useToasterNotification';
import AttendanceEventsTimeline from '../../components/MasterComponents/Usermanagement/Details/AttendanceEventsTimeline';
import {
	attendanceRowUserId,
	attendanceRowsFromResponse,
	eventsFromAttendanceRow,
	formatAttendanceUserName,
	getAttendanceStatusMeta,
} from './attendanceStatusUtils';

export type AttendanceEventsTimelineContext = {
	attendanceId?: number | string | null;
	userName?: string;
	date?: string;
	status?: string;
	events?: any[];
	userId?: number | null;
};

type AttendanceEventsTimelineModalProps = {
	isOpen: boolean;
	setIsOpen: (open: boolean) => void;
	context: AttendanceEventsTimelineContext | null;
};

const pickAttendanceRowForUser = (
	rows: any[],
	userId: number | null | undefined,
): any | null => {
	if (!rows?.length) return null;
	if (userId != null && !Number.isNaN(userId)) {
		const hit = rows.find((r) => attendanceRowUserId(r) === userId);
		if (hit) return hit;
	}
	return rows[0] ?? null;
};

const AttendanceEventsTimelineModal = ({
	isOpen,
	setIsOpen,
	context,
}: AttendanceEventsTimelineModalProps) => {
	const { showErrorNotification } = useToasterNotification();
	const [loading, setLoading] = useState(false);
	const [events, setEvents] = useState<any[]>([]);

	const statusMeta = getAttendanceStatusMeta(context?.status);
	const statusLabel = statusMeta?.label || context?.status?.replace(/_/g, ' ') || '—';
	const userName = context?.userName?.trim() || 'Employee';
	const dateLabel = context?.date || '—';

	useEffect(() => {
		if (!isOpen || !context) {
			setEvents([]);
			setLoading(false);
			return;
		}

		const inline = eventsFromAttendanceRow({ events: context.events });
		if (inline.length) {
			setEvents(inline);
			setLoading(false);
			return;
		}

		const attendanceId = context.attendanceId;
		const userId = context.userId ?? null;
		const date = context.date;

		const load = async () => {
			setLoading(true);
			try {
				if (attendanceId != null && attendanceId !== '') {
					const res = await authAxios.get(`/api/hr/attendance/${attendanceId}/`);
					const list = eventsFromAttendanceRow(res?.data);
					if (list.length) {
						setEvents(list);
						return;
					}
				}
				if (date && userId != null) {
					const res = await authAxios.get(
						`/api/hr/attendance/?date=${encodeURIComponent(String(date))}&user=${encodeURIComponent(String(userId))}&paginate=off`,
					);
					const row = pickAttendanceRowForUser(attendanceRowsFromResponse(res), userId);
					setEvents(eventsFromAttendanceRow(row));
					return;
				}
				setEvents([]);
			} catch (err) {
				showErrorNotification(err);
				setEvents([]);
			} finally {
				setLoading(false);
			}
		};

		load();
	}, [isOpen]);

	return (
		<Modal
			isOpen={isOpen}
			setIsOpen={setIsOpen}
			size='md'
			isCentered
			isScrollable
			titleId='attendance-events-timeline'>
			<ModalHeader setIsOpen={setIsOpen}>
				<ModalTitle id='attendance-events-timeline'>
					<div className='fw-semibold'>{userName}</div>
					<div className='text-muted small fw-normal mt-1'>{dateLabel}</div>
				</ModalTitle>
			</ModalHeader>
			<ModalBody className='px-4 pb-4'>
				<div
					className='d-flex align-items-center gap-2 px-3 py-2 mb-3 rounded-3'
					style={{ background: '#f1f3f5' }}>
					<span className='text-muted small'>Status:</span>
					<Chip
						label={statusLabel}
						size='small'
						sx={{
							fontWeight: 700,
							bgcolor: `${statusMeta?.color ?? '#6c757d'}22`,
							color: statusMeta?.color ?? '#495057',
						}}
					/>
				</div>

				<div className='p-3 rounded-3 border bg-white shadow-sm'>
					<div className='fw-semibold text-warning d-flex align-items-center gap-1 mb-2'>
						<AccessTimeIcon fontSize='small' />
						Attendance events
					</div>
					{loading ? (
						<div className='d-flex flex-column align-items-center gap-2 py-4'>
							<CustomSpinner />
							<span className='text-muted small'>Loading events…</span>
						</div>
					) : events.length === 0 ? (
						<div className='text-muted small'>No clock events for this day.</div>
					) : (
						<AttendanceEventsTimeline events={events} maxHeight='min(24rem, 50vh)' />
					)}
				</div>
			</ModalBody>
			<ModalFooter className='px-4 pb-4'>
				<Button color='dark' isLight onClick={() => setIsOpen(false)}>
					Close
				</Button>
			</ModalFooter>
		</Modal>
	);
};

export default AttendanceEventsTimelineModal;
