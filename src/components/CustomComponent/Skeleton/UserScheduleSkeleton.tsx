import React from 'react';
import './UserDetailSkeleton.css';

const CALENDAR_CELLS_COUNT = 35;
const TODAY_TILES_COUNT = 4;

const UserScheduleSkeleton: React.FC = () => {
	return (
		<div className='ud-skeleton-page'>
			<div className='row'>
				<div className='col-12 mb-4'>
					<div className='ud-skeleton-card'>
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

				<div className='col-12'>
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

export default UserScheduleSkeleton;
