import React from 'react';
import './GroupDetailSkeleton.css';

const DETAIL_ROWS_COUNT = 7;
const MEMBER_ROWS_COUNT = 5;
const CALENDAR_CELLS_COUNT = 35;

const GroupDetailSkeleton: React.FC = () => {
	return (
		<div className='gd-skeleton-page'>
			<div className='row g-4 align-items-stretch'>
				<div className='col-12 col-lg-6 mb-4 mb-lg-0 d-flex'>
					<div className='gd-skeleton-card gd-skeleton-side-card w-100'>
						<div className='gd-skeleton-panel-header'>
							<div className='gd-skeleton-line gd-skeleton-line--title gd-skeleton-shimmer' />
						</div>
						<div className='gd-skeleton-detail-rows'>
							{Array.from({ length: DETAIL_ROWS_COUNT }).map((_, index) => (
								<div key={index} className='gd-skeleton-detail-row'>
									<div className='gd-skeleton-line gd-skeleton-line--label gd-skeleton-shimmer mb-2' />
									<div className='gd-skeleton-line gd-skeleton-line--value gd-skeleton-shimmer' />
								</div>
							))}
						</div>
					</div>
				</div>

				<div className='col-12 col-lg-6 mb-4 mb-lg-0 d-flex'>
					<div className='gd-skeleton-card gd-skeleton-side-card w-100'>
						<div className='gd-skeleton-panel-header'>
							<div className='gd-skeleton-line gd-skeleton-line--title gd-skeleton-shimmer' />
							<div className='gd-skeleton-button gd-skeleton-shimmer' />
						</div>
						{Array.from({ length: MEMBER_ROWS_COUNT }).map((_, index) => (
							<div key={index} className='gd-skeleton-member-row'>
								<div className='flex-grow-1 min-w-0'>
									<div className='gd-skeleton-line gd-skeleton-line--member-name gd-skeleton-shimmer mb-2' />
									<div className='gd-skeleton-line gd-skeleton-line--member-email gd-skeleton-shimmer' />
								</div>
								<div className='gd-skeleton-icon-btn gd-skeleton-shimmer' />
							</div>
						))}
					</div>
				</div>

				<div className='col-12'>
					<div className='gd-skeleton-card mb-4'>
						<div className='gd-skeleton-panel-header'>
							<div className='gd-skeleton-line gd-skeleton-line--panel-title gd-skeleton-shimmer' />
						</div>
						<div className='gd-skeleton-calendar-grid'>
							{Array.from({ length: CALENDAR_CELLS_COUNT }).map((_, index) => (
								<div key={index} className='gd-skeleton-calendar-cell gd-skeleton-shimmer' />
							))}
						</div>
					</div>
				</div>
			</div>
		</div>
	);
};

export default GroupDetailSkeleton;
