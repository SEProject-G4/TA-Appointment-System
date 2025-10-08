import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import EditModuleDetails from '../components/EditModuleDetails';

jest.mock('../api/axiosConfig', () => ({
	__esModule: true,
	default: {
		get: jest.fn(),
		patch: jest.fn(),
	},
}));

import axiosInstance from '../api/axiosConfig';

const mockedGet = axiosInstance.get as jest.Mock;
const mockedPatch = axiosInstance.patch as jest.Mock;

describe('EditModuleDetails', () => {
	let consoleErrorSpy: jest.SpyInstance;

	beforeAll(() => {
		consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
	});

	afterAll(() => {
		consoleErrorSpy.mockRestore();
	});

	beforeEach(() => {
		jest.clearAllMocks();
	});

	it('shows loading then error', async () => {
		mockedGet.mockRejectedValueOnce(new Error('network'));

		render(<EditModuleDetails />);

		expect(screen.getByText(/Loading modules/i)).toBeInTheDocument();

		await waitFor(() => {
			expect(screen.getByText(/Failed to load your modules/i)).toBeInTheDocument();
		});
	});

	it('shows empty state when no modules', async () => {
		mockedGet.mockResolvedValueOnce({
			data: { pendingChanges: [], changesSubmitted: [], advertised: [] },
		});

		render(<EditModuleDetails />);

		await waitFor(() => {
			expect(screen.getByText(/No modules assigned to you/i)).toBeInTheDocument();
		});
	});

	it('allows editing and submitting module requirements', async () => {
		mockedGet.mockResolvedValueOnce({
			data: {
				pendingChanges: [
					{
						_id: 'm1',
						moduleCode: 'CS1010',
						moduleName: 'Intro to CS',
						semester: '1',
						year: '2025',
						coordinators: ['Dr. A'],
						applicationDueDate: '2025-10-10T00:00:00.000Z',
						documentDueDate: '2025-10-20T00:00:00.000Z',
						requiredTAHours: 0,
						requiredUndergraduateTACount: 0,
						requiredPostgraduateTACount: 0,
						requirements: '',
						moduleStatus: 'pending changes',
					},
				],
				changesSubmitted: [],
				advertised: [],
			},
		});

		mockedPatch.mockResolvedValueOnce({ status: 200 });

		render(<EditModuleDetails />);

		await waitFor(() => {
			expect(screen.getByText(/Edit Module Details/i)).toBeInTheDocument();
			expect(screen.getByText(/CS1010/i)).toBeInTheDocument();
		});

		fireEvent.click(screen.getByRole('button', { name: /Edit module/i }));

		const hours = screen.getByPlaceholderText('e.g., 6') as HTMLInputElement;
		const ug = screen.getByPlaceholderText('e.g., 3') as HTMLInputElement;
		const pg = screen.getByPlaceholderText('e.g., 2') as HTMLInputElement;
		const req = screen.getByPlaceholderText('Enter detailed requirements for TA applicants...') as HTMLTextAreaElement;

		let saveBtn = screen.getByRole('button', { name: /Save Changes/i });
		expect(saveBtn).toBeDisabled();

		fireEvent.change(hours, { target: { value: '6' } });
		fireEvent.change(ug, { target: { value: '3' } });
		fireEvent.change(pg, { target: { value: '1' } });
		fireEvent.change(req, { target: { value: 'Strong programming skills' } });

		saveBtn = screen.getByRole('button', { name: /Save Changes/i });
		expect(saveBtn).toBeEnabled();

		fireEvent.click(saveBtn);

		await waitFor(() => {
			expect(screen.getByText(/Confirm Submission/i)).toBeInTheDocument();
		});

		fireEvent.click(screen.getByRole('button', { name: /Confirm & Submit/i }));

		await waitFor(() => {
			expect(mockedPatch).toHaveBeenCalledWith('/lecturer/modules/m1', {
				requiredTAHours: 6,
				requiredUndergraduateTACount: 3,
				requiredPostgraduateTACount: 1,
				requirements: 'Strong programming skills',
			});
		});

		await waitFor(() => {
			expect(screen.queryByText(/Confirm Submission/i)).not.toBeInTheDocument();
		});
	});
});
