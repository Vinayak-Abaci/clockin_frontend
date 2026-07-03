import React from 'react';
import './ScheduleDetailSkeleton.css';

const DETAIL_FIELDS_COUNT = 9;
const GROUP_ROWS_COUNT = 4;
const STAT_CARDS_COUNT = 4;
const GROUP_CARDS_COUNT = 3;
const SHIFT_ROWS_COUNT = 2;
const CALENDAR_CELLS_COUNT = 35;

const ScheduleDetailSkeleton: React.FC = () => {
	return (
		<div className='sd-skeleton-page'>
			<div className='row'>
				<div className='col-12 mb-4'>
					<div className='sd-skeleton-card sd-skeleton-hero-card'>
						<div className='sd-skeleton-hero-row'>
							<div className='sd-skeleton-hero-main'>
								<div className='sd-skeleton-line sd-skeleton-line--badge sd-skeleton-shimmer mb-3' />
								<div className='sd-skeleton-line sd-skeleton-line--hero-title sd-skeleton-shimmer mb-3' />
								<div className='sd-skeleton-line sd-skeleton-line--meta sd-skeleton-shimmer mb-2' />
								<div className='sd-skeleton-line sd-skeleton-line--meta sd-skeleton-shimmer' />
							</div>
							<div className='sd-skeleton-hero-side'>
								<div className='sd-skeleton-hero-stat sd-skeleton-shimmer' />
								<div className='sd-skeleton-hero-stat-label sd-skeleton-shimmer' />
							</div>
						</div>
					</div>
					<div className='row g-3 mt-3 mb-3'>
						{Array.from({ length: STAT_CARDS_COUNT }).map((_, index) => (
							<div key={index} className='col-6 col-md-4 col-xl'>
								<div className='sd-skeleton-stat-card sd-skeleton-shimmer' />
							</div>
						))}
					</div>
					<div className='sd-skeleton-line sd-skeleton-line--panel-title sd-skeleton-shimmer mb-3' />
					<div className='row g-3'>
						{Array.from({ length: GROUP_CARDS_COUNT }).map((_, index) => (
							<div key={index} className='col-12 col-md-6 col-xl-4'>
								<div className='sd-skeleton-group-card sd-skeleton-shimmer' />
							</div>
						))}
					</div>
				</div>

				<div className='col-12 mb-4'>
					<div className='row g-4 align-items-stretch'>
						<div className='col-lg-7'>
							<div className='sd-skeleton-card h-100'>
								<div className='sd-skeleton-panel-header'>
									<div className='sd-skeleton-line sd-skeleton-line--title sd-skeleton-shimmer' />
								</div>
								<div className='sd-skeleton-detail-grid'>
									{Array.from({ length: DETAIL_FIELDS_COUNT }).map((_, index) => (
										<div key={index}>
											<div className='sd-skeleton-line sd-skeleton-line--label sd-skeleton-shimmer mb-2' />
											<div className='sd-skeleton-line sd-skeleton-line--value sd-skeleton-shimmer' />
										</div>
									))}
								</div>
							</div>
						</div>
						<div className='col-lg-5'>
							<div className='sd-skeleton-card sd-skeleton-groups-card h-100'>
								<div className='sd-skeleton-panel-header'>
									<div className='sd-skeleton-line sd-skeleton-line--title sd-skeleton-shimmer' />
									<div className='sd-skeleton-button sd-skeleton-shimmer' />
								</div>
								{Array.from({ length: GROUP_ROWS_COUNT }).map((_, index) => (
									<div key={index} className='sd-skeleton-group-row'>
										<div className='sd-skeleton-line sd-skeleton-line--group-name sd-skeleton-shimmer' />
										<div className='sd-skeleton-icon-btn sd-skeleton-shimmer' />
									</div>
								))}
							</div>
						</div>
					</div>
				</div>

				<div className='col-12 mb-4'>
					<div className='sd-skeleton-card'>
						<div className='sd-skeleton-panel-header'>
							<div className='sd-skeleton-line sd-skeleton-line--panel-title sd-skeleton-shimmer' />
						</div>
						<div className='d-flex flex-column gap-3'>
							{Array.from({ length: SHIFT_ROWS_COUNT }).map((_, index) => (
								<div key={index}>
									<div className='sd-skeleton-line sd-skeleton-line--label sd-skeleton-shimmer mb-2' />
									<div className='sd-skeleton-timeline-bar sd-skeleton-shimmer' />
								</div>
							))}
							<div className='sd-skeleton-timeline-axis sd-skeleton-shimmer' />
						</div>
					</div>
				</div>

				<div className='col-12'>
					<div className='sd-skeleton-card mb-4'>
						<div className='sd-skeleton-panel-header'>
							<div className='sd-skeleton-line sd-skeleton-line--panel-title sd-skeleton-shimmer' />
						</div>
						<div className='sd-skeleton-calendar-grid'>
							{Array.from({ length: CALENDAR_CELLS_COUNT }).map((_, index) => (
								<div key={index} className='sd-skeleton-calendar-cell sd-skeleton-shimmer' />
							))}
						</div>
					</div>
				</div>
			</div>
		</div>
	);
};

export default ScheduleDetailSkeleton;
