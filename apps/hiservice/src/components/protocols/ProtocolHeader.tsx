interface ProtocolHeaderProps {
  instanceName: string;
  logoUrl: string | null;
  address?: string | null;
  phone?: string | null;
  email?: string | null;
}

const ProtocolHeader = ({ instanceName, logoUrl, address, phone, email }: ProtocolHeaderProps) => {
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        {logoUrl && <img src={logoUrl} alt={instanceName} className="h-12 w-auto object-contain" />}
      </div>
      <div className="text-right text-xs text-foreground space-y-0.5">
        {address && <p>{address}</p>}
        {phone && (
          <p>
            Tel:{' '}
            <a href={`tel:${phone}`} className="hover:underline">
              {phone}
            </a>
          </p>
        )}
        {email && (
          <p>
            <a href={`mailto:${email}`} className="hover:underline">
              {email}
            </a>
          </p>
        )}
      </div>
    </div>
  );
};

export default ProtocolHeader;
