import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { Tooltip } from '@mui/material';
import Modal, { ModalBody, ModalFooter, ModalHeader, ModalTitle } from '../../../components/bootstrap/Modal';
import Button from '../../../components/bootstrap/Button';
import ListGroup, { ListGroupItem } from '../../../components/bootstrap/ListGroup';
import Icon from '../../../components/icon/Icon';
import type { TIcons } from '../../../type/icons-type';
import {
	assetRequestDocumentLabel,
	normalizeAssetDocuments,
	type AssetRequestDocument,
} from './assetRequestUtils';

export type AssetRequestViewDocumentsContext = {
	assetRequestId?: number | string;
	employeeName?: string;
	documents?: unknown;
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

type AssetRequestViewDocumentsModalProps = {
	isOpen: boolean;
	setIsOpen: (open: boolean) => void;
	context: AssetRequestViewDocumentsContext | null;
};

const AssetRequestViewDocumentsModal = ({
	isOpen,
	setIsOpen,
	context,
}: AssetRequestViewDocumentsModalProps) => {
	const [documents, setDocuments] = useState<AssetRequestDocument[]>([]);
	const subtitle = context?.employeeName || '';

	useEffect(() => {
		if (isOpen) {
			setDocuments(normalizeAssetDocuments(context?.documents));
		}
	}, [isOpen, context?.documents]);

	const openDocument = (doc: AssetRequestDocument) => {
		if (!doc.file) return;
		window.open(doc.file, '_blank', 'noopener,noreferrer');
	};

	return (
		<Modal isOpen={isOpen} setIsOpen={setIsOpen} size='md' isCentered isScrollable>
			<ModalHeader className='p-4 align-items-start' setIsOpen={setIsOpen}>
				<div className='d-flex flex-column w-100'>
					<ModalTitle id='asset-request-view-documents' className='mb-0'>
						Asset request documents
					</ModalTitle>
					{subtitle ? <div className='text-muted small fw-normal mt-1'>{subtitle}</div> : null}
				</div>
			</ModalHeader>
			<ModalBody className='px-4 pb-2'>
				{documents.length === 0 ? (
					<p className='text-muted mb-0 text-center py-4'>No documents uploaded for this request.</p>
				) : (
					<ListGroup isFlush>
						{documents.map((doc, index) => {
							const label = assetRequestDocumentLabel(doc);
							const fileIcon = getFileIcon(label);
							return (
								<ListGroupItem key={doc.id ?? `doc-${index}`} className='px-0 border-0'>
									<div className='d-flex align-items-center gap-3 py-2'>
										<div
											className='d-flex align-items-center justify-content-center rounded bg-light flex-shrink-0'
											style={{ width: 44, height: 44 }}>
											<Icon icon={fileIcon} size='2x' />
										</div>
										<div className='flex-grow-1 min-w-0'>
											<div className='fw-semibold text-truncate' title={label}>
												{label}
											</div>
										</div>
										{doc.file ? (
											<Tooltip arrow title='Open document' placement='top'>
												<span className='d-inline-flex'>
													<Button
														type='button'
														color='success'
														isLight
														size='sm'
														icon='Visibility'
														onClick={() => openDocument(doc)}
													/>
												</span>
											</Tooltip>
										) : null}
									</div>
								</ListGroupItem>
							);
						})}
					</ListGroup>
				)}
			</ModalBody>
			<ModalFooter className='px-4 pb-4'>
				<Button color='dark' isLight type='button' onClick={() => setIsOpen(false)}>
					Close
				</Button>
			</ModalFooter>
		</Modal>
	);
};

AssetRequestViewDocumentsModal.propTypes = {
	isOpen: PropTypes.bool.isRequired,
	setIsOpen: PropTypes.func.isRequired,
	context: PropTypes.object,
};

AssetRequestViewDocumentsModal.defaultProps = {
	context: null,
};

export default AssetRequestViewDocumentsModal;
