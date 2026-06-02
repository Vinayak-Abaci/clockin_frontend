import React, { useCallback, useEffect, useRef, useState } from 'react';
import Swal from 'sweetalert2';
import { Form } from 'reactstrap';
import { useForm } from 'react-hook-form';
import { Tooltip } from '@mui/material';
import { authAxios, authAxiosFileUpload } from '../../../../axiosInstance';
import Card, { CardActions, CardBody, CardHeader, CardLabel, CardTitle } from '../../../bootstrap/Card';
import Button from '../../../bootstrap/Button';
import FormGroup from '../../../bootstrap/forms/FormGroup';
import CustomSpinner from '../../../CustomSpinner/CustomSpinner';
import OffCanvasComponent from '../../../OffCanvasComponent';
import SaveButton from '../../../CustomComponent/Buttons/SaveButton';
import AddButton from '../../../CustomComponent/Buttons/AddButton';
import ListGroup, { ListGroupItem } from '../../../bootstrap/ListGroup';
import Icon from '../../../icon/Icon';
import useToasterNotification from '../../../../hooks/useToasterNotification';
import useDarkMode from '../../../../hooks/useDarkMode';
import { buttonColor } from '../../../../helpers/constants';
import Moments from '../../../../helpers/Moment';
import type { TIcons } from '../../../../type/icons-type';
import { Player } from '@lottiefiles/react-lottie-player';
import noDataLottie from '../../../../assets/Lottie/NoData.json';

const ACCOUNT_DETAIL_URL = (userId: string | number) => `api/hr/accounts/${userId}/`;
const USER_DOCUMENT_DELETE_URL = (id: string | number) => `api/hr/user-documents/${id}/`;

/** Fixed card height; file list scrolls when there are more items. */
const DOCUMENTS_CARD_HEIGHT_PX = 550;

/** Matches account `documents_data` from GET /api/hr/accounts/:id/ */
export type UserDocument = {
	id: number | string;
	file: string;
	name?: string | null;
	uploaded_at?: string;
	uploaded_by?: number | string;
};

const normalizeDocumentsList = (data: unknown): UserDocument[] => {
	if (Array.isArray(data)) return data as UserDocument[];
	return [];
};

const getFileName = (doc: UserDocument): string => {
	if (doc.name?.trim()) return doc.name.trim();
	if (typeof doc.file === 'string' && doc.file) {
		try {
			const path = new URL(doc.file).pathname;
			return decodeURIComponent(path.split('/').pop() || '') || `Document ${doc.id}`;
		} catch {
			return doc.file.split('/').pop() || `Document ${doc.id}`;
		}
	}
	return `Document ${doc.id}`;
};

/** e.g. user_documents / 11 / Test1.pdf */
const getFilePathDisplay = (fileUrl: string): string => {
	try {
		const parts = new URL(fileUrl).pathname.split('/').filter(Boolean);
		const rootIdx = parts.findIndex((p) => p === 'user_documents');
		if (rootIdx >= 0) return parts.slice(rootIdx).join(' / ');
		const mediaIdx = parts.indexOf('media');
		if (mediaIdx >= 0 && parts.length > mediaIdx + 2) {
			return parts.slice(mediaIdx + 2).join(' / ');
		}
		return parts.slice(-3).join(' / ');
	} catch {
		return fileUrl;
	}
};

const getFileExtension = (fileName: string): string => {
	const base = fileName.split('?')[0];
	const dot = base.lastIndexOf('.');
	return dot >= 0 ? base.slice(dot + 1).toLowerCase() : '';
};

const getFileIcon = (fileName: string): TIcons => {
	const ext = getFileExtension(fileName);
	if (['pdf'].includes(ext)) return 'PictureAsPdf';
	if (['png', 'jpg', 'jpeg', 'gif', 'webp', 'bmp', 'svg'].includes(ext)) return 'Image';
	if (['doc', 'docx', 'txt', 'rtf'].includes(ext)) return 'Description';
	if (['xls', 'xlsx', 'csv'].includes(ext)) return 'InsertDriveFile';
	return 'InsertDriveFile';
};

type AddDocumentForm = {
	name: string;
	file: FileList;
};

const AddUserDocumentOffCanvas = ({
	isOpen,
	setIsOpen,
	userId,
	onUploaded,
}: {
	isOpen: boolean;
	setIsOpen: (open: boolean) => void;
	userId: string;
	onUploaded: () => void;
}) => {
	const { register, handleSubmit, reset, formState: { errors } } = useForm<AddDocumentForm>();
	const [waitingForAxios, setWaitingForAxios] = useState(false);
	const { showErrorNotification, showSuccessNotification } = useToasterNotification();

	useEffect(() => {
		if (isOpen) reset({ name: '', file: undefined as unknown as FileList });
	}, [isOpen, reset]);

	const onSubmit = (data: AddDocumentForm) => {
		const file = data.file?.[0];
		if (!file) return;
		const formData = new FormData();
		formData.append('documents', file);
		if (data.name?.trim()) formData.append('name', data.name.trim());

		setWaitingForAxios(true);
		authAxiosFileUpload
			.patch(ACCOUNT_DETAIL_URL(userId), formData)
			.then(() => {
				showSuccessNotification('Document uploaded successfully');
				setIsOpen(false);
				onUploaded();
			})
			.catch(showErrorNotification)
			.finally(() => setWaitingForAxios(false));
	};

	return (
		<OffCanvasComponent isOpen={isOpen} placement='end' title='Add document' setOpen={setIsOpen}>
			<Form onSubmit={handleSubmit(onSubmit)}>
				<Card>
					<CardBody>
						<FormGroup label='Document name (optional)'>
							<input type='text' className='form-control' {...register('name')} />
						</FormGroup>
						<FormGroup label='File *'>
							<input
								type='file'
								className='form-control'
								accept='.pdf,.doc,.docx,.png,.jpg,.jpeg,.xls,.xlsx'
								{...register('file', { required: true })}
							/>
							{errors.file?.type === 'required' && (
								<span className='text-danger small'>*This field is required</span>
							)}
						</FormGroup>
						<div className='pt-3'>
							<SaveButton state={waitingForAxios} />
						</div>
					</CardBody>
				</Card>
			</Form>
		</OffCanvasComponent>
	);
};

const DocumentListItem = ({
	doc,
	onDownload,
	onDelete,
	darkModeStatus,
}: {
	doc: UserDocument;
	onDownload: (doc: UserDocument) => void;
	onDelete: (doc: UserDocument) => void;
	darkModeStatus: boolean;
}) => {
	const fileName = getFileName(doc);
	const filePath = typeof doc.file === 'string' ? getFilePathDisplay(doc.file) : '';
	const fileIcon = getFileIcon(fileName);

	return (
		<ListGroupItem tag='div' className='py-3'>
			<div className='d-flex align-items-start gap-3'>
				<div
					className='d-flex align-items-center justify-content-center rounded flex-shrink-0 bg-l10-warning text-warning'
					style={{ width: 44, height: 44 }}>
					<Icon icon={fileIcon} size='2x' />
				</div>
				<div className='flex-grow-1 min-w-0'>
					<div className='fw-semibold text-truncate' title={fileName}>
						{fileName}
					</div>
					{/* {filePath && (
						<div className='small text-muted text-truncate d-flex align-items-center gap-1 mt-1'>
							<Icon icon='Folder' size='sm' className='flex-shrink-0' />
							<span title={filePath}>{filePath}</span>
						</div>
					)} */}
					<div className='small text-muted mt-1'>
						{doc.uploaded_at ? Moments(doc.uploaded_at, 'datetimeseconds') : '—'}
					</div>
				</div>
				<div className='d-flex flex-shrink-0 gap-1'>
					<Tooltip arrow title='Open / download' placement='top'>
						<Button
							isOutline={false}
							color={darkModeStatus ? 'light' : 'dark'}
							isLight
							size='sm'
							icon='Download'
							onClick={() => onDownload(doc)}
						/>
					</Tooltip>
					<Tooltip arrow title='Delete' placement='top'>
						<Button
							isOutline={false}
							color='danger'
							isLight
							size='sm'
							icon='Delete'
							onClick={() => onDelete(doc)}
						/>
					</Tooltip>
				</div>
			</div>
		</ListGroupItem>
	);
};

type Props = { userId?: string };

const UserDocumentsSection = ({ userId }: Props) => {
	const [documents, setDocuments] = useState<UserDocument[]>([]);
	const [loading, setLoading] = useState(false);
	const [addOpen, setAddOpen] = useState(false);
	const { showErrorNotification, showSuccessNotification } = useToasterNotification();
	const { darkModeStatus } = useDarkMode();
	const fetchIdRef = useRef(0);

	const fetchDocuments = useCallback(() => {
		if (!userId) {
			setDocuments([]);
			return;
		}
		const fetchId = ++fetchIdRef.current;
		setLoading(true);
		authAxios
			.get(ACCOUNT_DETAIL_URL(userId))
			.then((res) => {
				if (fetchId !== fetchIdRef.current) return;
				setDocuments(normalizeDocumentsList(res.data?.documents_data));
			})
			.catch((err) => {
				if (fetchId !== fetchIdRef.current) return;
				setDocuments([]);
				showErrorNotification(err);
			})
			.finally(() => {
				if (fetchId === fetchIdRef.current) setLoading(false);
			});
	}, []);

	useEffect(() => {
		fetchDocuments();
	}, [fetchDocuments]);

	const handleDownload = (doc: UserDocument) => {
		if (!doc.file) {
			showErrorNotification('No file available to download');
			return;
		}
		window.open(doc.file, '_blank', 'noopener,noreferrer');
	};

	const handleDelete = (doc: UserDocument) => {
		const fileName = getFileName(doc);
		Swal.fire({
			title: 'Delete document?',
			text: `Remove "${fileName}"? This cannot be undone.`,
			icon: 'warning',
			showCancelButton: true,
			iconColor: buttonColor[0],
			confirmButtonColor: buttonColor[0],
			cancelButtonColor: buttonColor[1],
			confirmButtonText: 'Delete',
		}).then((result) => {
			if (!result.isConfirmed) return;
			authAxios
				.delete(USER_DOCUMENT_DELETE_URL(doc.id))
				.then(() => {
					showSuccessNotification('Document deleted');
					fetchDocuments();
				})
				.catch(showErrorNotification);
		});
	};

	if (!userId) return null;

	return (
		<div className='w-100'>
			<Card
				className='d-flex flex-column overflow-hidden'
				style={{ height: DOCUMENTS_CARD_HEIGHT_PX, maxHeight: DOCUMENTS_CARD_HEIGHT_PX }}>
				<CardHeader className='flex-shrink-0'>
					<CardLabel icon='Description' iconColor='warning'>
						<CardTitle tag='div' className='h5 text-warning'>
							Documents
						</CardTitle>
					</CardLabel>
					<CardActions>
						<AddButton modalShow={setAddOpen} name='Add document' />
					</CardActions>
				</CardHeader>
				<CardBody
					className='d-flex flex-column flex-grow-1 overflow-hidden pt-0'
					style={{ minHeight: 0 }}>
					{loading ? (
						<div className='d-flex justify-content-center align-items-center flex-grow-1 py-4'>
							<CustomSpinner />
						</div>
					) : documents.length === 0 ? (
						<div className='d-flex flex-grow-1 w-100 align-items-center justify-content-center'>
							<div className='text-center px-3'>
								<Player
									autoplay
									loop
									src={noDataLottie}
									style={{ height: 180, width: 180, margin: '0 auto' }}
								/>
								<p className='text-muted mb-0 mt-2 small'>No documents uploaded for this user.</p>
							</div>
						</div>
					) : (
						<>
							
							<div className='flex-grow-1 overflow-auto'>
								<ListGroup isFlush>
									{documents.map((doc) => (
										<DocumentListItem
											key={doc.id}
											doc={doc}
											onDownload={handleDownload}
											onDelete={handleDelete}
											darkModeStatus={darkModeStatus}
										/>
									))}
								</ListGroup>
							</div>
						</>
					)}
				</CardBody>
			</Card>
			<AddUserDocumentOffCanvas
				isOpen={addOpen}
				setIsOpen={setAddOpen}
				userId={userId}
				onUploaded={fetchDocuments}
			/>
		</div>
	);
};

export default UserDocumentsSection;
