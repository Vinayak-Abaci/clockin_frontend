import React, { useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import dayjs from 'dayjs';
import CommentIcon from '@mui/icons-material/Comment';
import Modal, { ModalBody, ModalFooter, ModalHeader, ModalTitle } from '../../../components/bootstrap/Modal';
import Button from '../../../components/bootstrap/Button';
import CustomSpinner from '../../../components/CustomSpinner/CustomSpinner';
import Icon from '../../../components/icon/Icon';
import { authAxios } from '../../../axiosInstance';
import useDarkMode from '../../../hooks/useDarkMode';
import useToasterNotification from '../../../hooks/useToasterNotification';
import {
	assetRequestCommandsUrl,
	assetRequestDetailUrl,
	formatAssetRequestCommandAuthor,
	normalizeAssetRequestCommands,
	assetRequestCommandText,
	type AssetRequestCommand,
} from './assetRequestUtils';

export type AssetRequestCommentsContext = {
	assetRequestId?: number | string;
	employeeName?: string;
	description?: string;
	status?: string;
};

type AssetRequestCommentsModalProps = {
	isOpen: boolean;
	setIsOpen: (open: boolean) => void;
	context: AssetRequestCommentsContext | null;
};

const labelStyle = (muted: string) => ({
	fontSize: '0.7rem',
	fontWeight: 600,
	letterSpacing: '0.06em',
	textTransform: 'uppercase' as const,
	color: muted,
	marginBottom: 4,
});

const AssetRequestCommentsModal = ({
	isOpen,
	setIsOpen,
	context,
}: AssetRequestCommentsModalProps) => {
	const { darkModeStatus } = useDarkMode();
	const { showErrorNotification, showSuccessNotification } = useToasterNotification();
	const showErrorRef = useRef(showErrorNotification);
	showErrorRef.current = showErrorNotification;

	const [commands, setCommands] = useState<AssetRequestCommand[]>([]);
	const [loading, setLoading] = useState(false);
	const [commentText, setCommentText] = useState('');
	const [commentSaving, setCommentSaving] = useState(false);

	const assetRequestId = context?.assetRequestId;

	const textPrimary = darkModeStatus ? '#f8f9fa' : '#111827';
	const textMuted = darkModeStatus ? '#9ca3af' : '#6b7280';
	const textSubtle = darkModeStatus ? '#6b7280' : '#9ca3af';
	const surface = darkModeStatus ? 'rgba(255,255,255,0.06)' : '#f3f4f6';
	const border = darkModeStatus ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)';

	const fetchDetail = () => {
		if (assetRequestId == null || assetRequestId === '') return Promise.resolve();
		return authAxios.get(assetRequestDetailUrl(assetRequestId)).then((res) => {
			setCommands(normalizeAssetRequestCommands(res?.data));
		});
	};

	useEffect(() => {
		if (!isOpen || assetRequestId == null || assetRequestId === '') {
			setCommands([]);
			setCommentText('');
			return undefined;
		}

		let cancelled = false;
		setLoading(true);
		authAxios
			.get(assetRequestDetailUrl(assetRequestId))
			.then((res) => {
				if (!cancelled) {
					setCommands(normalizeAssetRequestCommands(res?.data));
				}
			})
			.catch((err) => {
				if (!cancelled) {
					setCommands([]);
					showErrorRef.current(err);
				}
			})
			.finally(() => {
				if (!cancelled) setLoading(false);
			});

		return () => {
			cancelled = true;
		};
	}, [isOpen, assetRequestId]);

	useEffect(() => {
		if (!isOpen) {
			setCommentText('');
			setCommentSaving(false);
		}
	}, [isOpen]);

	const handleAddComment = () => {
		const text = commentText.trim();
		if (!text) {
			showErrorNotification('Enter a comment');
			return;
		}
		if (assetRequestId == null || assetRequestId === '') {
			showErrorNotification('Asset request not found');
			return;
		}

		setCommentSaving(true);
		authAxios
			.post(assetRequestCommandsUrl(assetRequestId), { command: text })
			.then(() => {
				showSuccessNotification('Comment added');
				setCommentText('');
				return fetchDetail();
			})
			.catch(showErrorNotification)
			.finally(() => setCommentSaving(false));
	};

	const modalTitle = context?.employeeName?.trim() || 'Asset request';

	return (
		<Modal isOpen={isOpen} setIsOpen={setIsOpen} size='md' isCentered isScrollable>
			<ModalHeader className='p-4 align-items-start' setIsOpen={setIsOpen}>
				<div className='d-flex flex-column w-100'>
					<ModalTitle id='asset-request-comments' className='mb-0'>
						{modalTitle}
					</ModalTitle>
					{context?.description ? (
						<div className='text-muted small fw-normal mt-1'>{context.description}</div>
					) : null}
				</div>
			</ModalHeader>
			<ModalBody className='px-4 pb-2'>
				{(context?.status || context?.description) && (
					<div
						className='rounded-3 p-3 mb-4'
						style={{
							backgroundColor: surface,
							border: `1px solid ${border}`,
						}}>
						{context?.status ? (
							<div>
								<div style={labelStyle(textSubtle)}>Status</div>
								<div style={{ color: textPrimary, fontWeight: 600 }}>{context.status}</div>
							</div>
						) : null}
					</div>
				)}

				<div className='fw-semibold text-warning mb-3 d-flex align-items-center gap-1'>
					<CommentIcon fontSize='small' />
					Comments
				</div>

				{loading ? (
					<div className='d-flex justify-content-center py-4'>
						<CustomSpinner />
					</div>
				) : commands.length === 0 ? (
					<p className='text-muted small text-center py-4 mb-0'>No comments yet.</p>
				) : (
					<div className='d-flex flex-column' style={{ gap: 20 }}>
						{commands.map((cmd, index) => {
							const text = assetRequestCommandText(cmd);
							const author = formatAssetRequestCommandAuthor(cmd.command_by);
							const timestamp = cmd.command_datetime || cmd.created_at;
							const isLast = index === commands.length - 1;

							return (
								<div key={cmd.id ?? `command-${index}`} className='d-flex' style={{ gap: 16 }}>
									<div
										className='d-flex flex-column align-items-center flex-shrink-0'
										style={{ width: 36 }}>
										<div
											className='d-flex align-items-center justify-content-center rounded-circle flex-shrink-0'
											style={{
												width: 36,
												height: 36,
												backgroundColor: darkModeStatus
													? 'rgba(255,193,7,0.15)'
													: 'rgba(255,193,7,0.12)',
												border: `1px solid ${border}`,
											}}>
											<Icon icon='Comment' size='lg' color='warning' />
										</div>
										{!isLast ? (
											<div
												style={{
													width: 2,
													flex: 1,
													minHeight: 24,
													marginTop: 10,
													borderRadius: 2,
													backgroundColor: darkModeStatus
														? 'rgba(255,255,255,0.14)'
														: '#e5e7eb',
												}}
											/>
										) : null}
									</div>
									<div className='flex-grow-1 pb-1'>
										<div
											className='rounded-3 p-3'
											style={{
												backgroundColor: darkModeStatus
													? 'rgba(255,255,255,0.04)'
													: '#ffffff',
												border: `1px solid ${border}`,
											}}>
											<div style={{ color: textPrimary, fontWeight: 500 }}>{text}</div>
											<div className='text-muted small mt-2'>
												{timestamp
													? dayjs(timestamp).format('MMM D, YYYY h:mm A')
													: '—'}
												{author ? <span className='ms-2'>· By {author}</span> : null}
											</div>
										</div>
									</div>
								</div>
							);
						})}
					</div>
				)}

				<div className='border-top mt-4 pt-3'>
					<label className='form-label small fw-semibold mb-1' htmlFor='asset-request-comment'>
						Add comment
					</label>
					<textarea
						id='asset-request-comment'
						className='form-control'
						rows={3}
						value={commentText}
						placeholder='Write a comment about this request'
						onChange={(e) => setCommentText(e.target.value)}
					/>
				</div>
			</ModalBody>
			<ModalFooter className='px-4 pb-4 d-flex justify-content-end gap-2'>
				<Button color='dark' isLight type='button' onClick={() => setIsOpen(false)}>
					Close
				</Button>
				<Button
					color='warning'
					type='button'
					isDisable={commentSaving || !commentText.trim()}
					onClick={handleAddComment}>
					{commentSaving ? 'Saving…' : 'Add comment'}
				</Button>
			</ModalFooter>
		</Modal>
	);
};

AssetRequestCommentsModal.propTypes = {
	isOpen: PropTypes.bool.isRequired,
	setIsOpen: PropTypes.func.isRequired,
	context: PropTypes.object,
};

AssetRequestCommentsModal.defaultProps = {
	context: null,
};

export default AssetRequestCommentsModal;
