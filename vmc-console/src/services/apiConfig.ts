/**
 * Regional VMware datacenter API endpoint configuration.
 *
 * In production, override these via environment variables:
 *   NEXT_PUBLIC_VCENTER_USE1_URL=https://vcenter.sddc-use1-prod.vmwarevmc.com/api
 *   NEXT_PUBLIC_VMC_API_URL=https://vmc.vmware.com/vmc/api
 *   NEXT_PUBLIC_USE_MOCK_API=false
 *
 * The VMware Cloud REST API surface this client is designed against:
 *   • vCenter REST API  → https://{vcenter}/api
 *   • NSX Manager API   → https://{nsx-mgr}/api/v1
 *   • VMC API           → https://vmc.vmware.com/vmc/api
 *   • Content Library   → https://{vcenter}/api/content/library
 */

export interface RegionalEndpoints {
  /** vCenter 8.x REST API base (no trailing slash) */
  vcenterApi: string;
  /** NSX-T Manager REST API base */
  nsxApi: string;
  /** VMware Cloud (SDDC management) API */
  vmcApi: string;
  /** Content Library API – part of vCenter but aliased separately */
  contentLibraryApi: string;
  /** Human-readable region label */
  label: string;
}

export const REGIONAL_ENDPOINTS: Record<string, RegionalEndpoints> = {
  'us-east-1': {
    label: 'US East (N. Virginia)',
    vcenterApi:        process.env.NEXT_PUBLIC_VCENTER_USE1_URL        ?? 'https://vcenter.sddc-use1-prod.vmwarevmc.com/api',
    nsxApi:            process.env.NEXT_PUBLIC_NSX_USE1_URL            ?? 'https://nsx.sddc-use1-prod.vmwarevmc.com/api/v1',
    vmcApi:            process.env.NEXT_PUBLIC_VMC_API_URL             ?? 'https://vmc.vmware.com/vmc/api',
    contentLibraryApi: process.env.NEXT_PUBLIC_CL_USE1_URL             ?? 'https://vcenter.sddc-use1-prod.vmwarevmc.com/api/content',
  },
  'us-west-2': {
    label: 'US West (Oregon)',
    vcenterApi:        process.env.NEXT_PUBLIC_VCENTER_USW2_URL        ?? 'https://vcenter.sddc-usw2-prod.vmwarevmc.com/api',
    nsxApi:            process.env.NEXT_PUBLIC_NSX_USW2_URL            ?? 'https://nsx.sddc-usw2-prod.vmwarevmc.com/api/v1',
    vmcApi:            process.env.NEXT_PUBLIC_VMC_API_URL             ?? 'https://vmc.vmware.com/vmc/api',
    contentLibraryApi: process.env.NEXT_PUBLIC_CL_USW2_URL             ?? 'https://vcenter.sddc-usw2-prod.vmwarevmc.com/api/content',
  },
  'eu-west-2': {
    label: 'EU (London)',
    vcenterApi:        process.env.NEXT_PUBLIC_VCENTER_EUW2_URL        ?? 'https://vcenter.sddc-euw2-prod.vmwarevmc.com/api',
    nsxApi:            process.env.NEXT_PUBLIC_NSX_EUW2_URL            ?? 'https://nsx.sddc-euw2-prod.vmwarevmc.com/api/v1',
    vmcApi:            process.env.NEXT_PUBLIC_VMC_API_URL             ?? 'https://vmc.vmware.com/vmc/api',
    contentLibraryApi: process.env.NEXT_PUBLIC_CL_EUW2_URL             ?? 'https://vcenter.sddc-euw2-prod.vmwarevmc.com/api/content',
  },
  'ap-southeast-1': {
    label: 'AP (Singapore)',
    vcenterApi:        process.env.NEXT_PUBLIC_VCENTER_APSE1_URL       ?? 'https://vcenter.sddc-apse1-prod.vmwarevmc.com/api',
    nsxApi:            process.env.NEXT_PUBLIC_NSX_APSE1_URL           ?? 'https://nsx.sddc-apse1-prod.vmwarevmc.com/api/v1',
    vmcApi:            process.env.NEXT_PUBLIC_VMC_API_URL             ?? 'https://vmc.vmware.com/vmc/api',
    contentLibraryApi: process.env.NEXT_PUBLIC_CL_APSE1_URL            ?? 'https://vcenter.sddc-apse1-prod.vmwarevmc.com/api/content',
  },
};

/** Set NEXT_PUBLIC_USE_MOCK_API=false to hit real regional endpoints */
export const USE_MOCK_API = process.env.NEXT_PUBLIC_USE_MOCK_API !== 'false';

export function getEndpoints(region: string): RegionalEndpoints {
  return REGIONAL_ENDPOINTS[region] ?? REGIONAL_ENDPOINTS['us-east-1'];
}
