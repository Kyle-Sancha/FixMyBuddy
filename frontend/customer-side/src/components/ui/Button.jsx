import { Link } from 'react-router-dom';

const variants = {
  primary: 'primary-action',
  secondary: 'secondary-action',
  muted: 'muted-action',
  ghost: 'inline-flex h-11 items-center justify-center rounded-lg px-3 text-base font-semibold text-[rgb(var(--fmb-muted))] transition hover:bg-white/5 hover:text-[rgb(var(--fmb-text))]',
};

export function Button({
  children,
  className = '',
  to,
  type = 'button',
  variant = 'primary',
  ...props
}) {
  const classes = `${variants[variant]} ${className}`.trim();

  if (to) {
    return (
      <Link className={classes} to={to} {...props}>
        {children}
      </Link>
    );
  }

  return (
    <button className={classes} type={type} {...props}>
      {children}
    </button>
  );
}

