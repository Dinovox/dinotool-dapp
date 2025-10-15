import type { PropsWithChildren } from 'react';
import { faInfoCircle } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import classNames from 'classnames';
import { WithClassnameType } from 'types';

interface CardType extends PropsWithChildren, WithClassnameType {
  title: string | React.ReactNode;
  description?: string | React.ReactNode;
  reference: string;
  anchor?: string;
}

export const Card = (props: CardType) => {
  const { title, children, description, reference, anchor, className } = props;

  return (
    <div className='rounded-2xl bg-white shadow-md p-6'>
      <div
        id={anchor}
        data-testid={props['data-testid']}
        className={classNames(
          // style de base “pro”
          'flex flex-col flex-1 justify-center',
          'rounded-2xl bg-white/85 backdrop-blur',
          'border border-slate-200 shadow-sm',
          'p-5 md:p-6',
          'transition-shadow hover:shadow-md',
          className
        )}
      >
        <div className='flex items-start justify-between gap-3'>
          <h2 className='text-xl font-semibold tracking-tight text-slate-800'>
            {title}
          </h2>

          {reference ? (
            <a
              href={reference}
              target='_blank'
              rel='noreferrer'
              className='inline-flex items-center rounded-md px-2 py-1 text-xs font-medium
                       text-slate-600 hover:text-slate-800
                       hover:bg-slate-100/80 transition-colors'
              title='More info'
            >
              <FontAwesomeIcon icon={faInfoCircle} className='h-3.5 w-3.5' />
            </a>
          ) : null}
        </div>

        {description ? (
          <p className='mt-1.5 text-sm leading-relaxed text-slate-500'>
            {description}
          </p>
        ) : null}

        {/* petite séparation seulement si description + contenu */}
        {description && children ? (
          <div className='my-4 h-px bg-slate-100' />
        ) : (
          <div className='mt-3' />
        )}

        {children}
      </div>
    </div>
  );
};
