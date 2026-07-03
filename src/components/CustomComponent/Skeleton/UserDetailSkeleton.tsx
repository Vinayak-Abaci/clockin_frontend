import React from 'react';
import './UserDetailSkeleton.css';

const DETAIL_FIELDS_COUNT = 11;
const DOCUMENT_ROWS_COUNT = 4;
const CALENDAR_CELLS_COUNT = 35;
const TODAY_TILES_COUNT = 4;

const UserDetailSkeleton: React.FC = () => {
	return (
		<div className='ud-skeleton-page'>
			<div className='row g-4 align-items-stretch'>
				<div className='col-12 col-lg-6 mb-4 d-flex flex-column'>
					{/* User profile card */}
					<div className='ud-skeleton-card mb-4'>
						<div className='ud-skeleton-profile-row mb-4'>
							<div className='ud-skeleton-avatar ud-skeleton-shimmer' />
							<div className='flex-grow-1 min-w-0'>
								<div className='ud-skeleton-line ud-skeleton-line--name ud-skeleton-shimmer mb-2' />
								<div className='ud-skeleton-line ud-skeleton-line--email ud-skeleton-shimmer' />
							</div>
						</div>
						<div className='ud-skeleton-detail-grid'>
							{Array.from({ length: DETAIL_FIELDS_COUNT }).map((_, index) => (
								<div key={index} className='ud-skeleton-detail-tile'>
									<div className='ud-skeleton-line ud-skeleton-line--label ud-skeleton-shimmer mb-2' />
									<div className='ud-skeleton-line ud-skeleton-line--value ud-skeleton-shimmer' />
								</div>
							))}
						</div>
					</div>

					{/* Today info card */}
					<div className='ud-skeleton-card flex-grow-1'>
						<div className='ud-skeleton-line ud-skeleton-line--today-title ud-skeleton-shimmer mb-4' />
						<div className='ud-skeleton-today-grid'>
							{Array.from({ length: TODAY_TILES_COUNT }).map((_, index) => (
								<div key={index} className='ud-skeleton-today-tile'>
									<div className='ud-skeleton-line ud-skeleton-line--label ud-skeleton-shimmer mb-2' />
									<div className='ud-skeleton-chip ud-skeleton-shimmer' />
								</div>
							))}
						</div>
					</div>
				</div>

				<div className='col-12 col-lg-6 mb-4 d-flex flex-column'>
					{/* Documents card */}
					<div className='ud-skeleton-card ud-skeleton-documents-card'>
						<div className='ud-skeleton-panel-header'>
							<div className='ud-skeleton-line ud-skeleton-line--panel-title ud-skeleton-shimmer' />
							<div className='ud-skeleton-button ud-skeleton-shimmer' />
						</div>
						{Array.from({ length: DOCUMENT_ROWS_COUNT }).map((_, index) => (
							<div key={index} className='ud-skeleton-document-row'>
								<div className='ud-skeleton-document-icon ud-skeleton-shimmer' />
								<div className='flex-grow-1 min-w-0'>
									<div className='ud-skeleton-line ud-skeleton-line--doc-name ud-skeleton-shimmer mb-2' />
									<div className='ud-skeleton-line ud-skeleton-line--doc-date ud-skeleton-shimmer' />
								</div>
								<div className='d-flex gap-2 flex-shrink-0'>
									<div className='ud-skeleton-icon-btn ud-skeleton-shimmer' />
									<div className='ud-skeleton-icon-btn ud-skeleton-shimmer' />
								</div>
							</div>
						))}
					</div>
				</div>

				<div className='col-12'>
					{/* Monthly schedule calendar card */}
					<div className='ud-skeleton-card'>
						<div className='ud-skeleton-panel-header'>
							<div className='ud-skeleton-line ud-skeleton-line--panel-title ud-skeleton-shimmer' />
						</div>
						<div className='ud-skeleton-calendar-grid'>
							{Array.from({ length: CALENDAR_CELLS_COUNT }).map((_, index) => (
								<div key={index} className='ud-skeleton-calendar-cell ud-skeleton-shimmer' />
							))}
						</div>
					</div>
				</div>
			</div>
		</div>
	);
};

export default UserDetailSkeleton;
