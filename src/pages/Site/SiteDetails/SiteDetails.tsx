import React from 'react';

export const formatSitePersonName = (person: unknown): string => {
	if (!person || typeof person !== 'object') return '';
	const p = person as Record<string, unknown>;
	const preferred = String(p.preferred_name ?? '').trim();
	if (preferred) return preferred;
	const full = `${p.first_name ?? ''} ${p.last_name ?? ''}`.trim();
	return full || String(p.email ?? '').trim();
};

export const formatSiteTimezone = (site: Record<string, unknown> | null | undefined): string => {
	if (!site) return '';
	const tz = site.timezone ?? site.time_zone;
	if (tz == null) return '';
	if (typeof tz === 'string') return tz;
	if (typeof tz === 'object' && tz !== null) {
		const t = tz as Record<string, unknown>;
		return String(t.display_name ?? t.name ?? t.timezone ?? t.tz ?? t.label ?? '').trim();
	}
	return '';
};

type SiteDetailItem = {
	label: string;
	value: string;
};

export const getSiteDetailItems = (site: Record<string, unknown> | null | undefined): SiteDetailItem[] => {
	if (!site) return [];

	const parentName =
		(site.parent_site_name as string | undefined) ||
		(typeof site.parent_site === 'object' && site.parent_site !== null
			? String((site.parent_site as Record<string, unknown>).name ?? '')
			: '');

	const authorityOne =
		(site.authority_one_name as string | undefined) || formatSitePersonName(site.authority_one);
	const authorityTwo =
		(site.authority_two_name as string | undefined) || formatSitePersonName(site.authority_two);

	return [
		{ label: 'Type', value: String(site.type ?? '').trim() },
		{ label: 'Timezone', value: formatSiteTimezone(site) },
		{ label: 'Parent site', value: parentName },
		{ label: 'Authority one', value: authorityOne },
		{ label: 'Authority two', value: authorityTwo },
	].filter((item) => item.value);
};

type SiteDetailsHeroMetaProps = {
	site: Record<string, unknown> | null | undefined;
};

const SiteDetailsHeroMeta = ({ site }: SiteDetailsHeroMetaProps) => {
	const items = getSiteDetailItems(site);
	if (items.length === 0) return null;

	return (
		<div className='hr-dashboard__hero-details'>
			{items.map((item) => (
				<div key={item.label} className='hr-dashboard__hero-detail-item'>
					<span className='hr-dashboard__hero-detail-label'>{item.label}</span>
					<span className='hr-dashboard__hero-detail-value'>{item.value}</span>
				</div>
			))}
		</div>
	);
};

export default SiteDetailsHeroMeta;
