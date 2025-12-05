import React, {useState, useEffect} from "react";
import {useParams, useNavigate} from "react-router-dom";
import axios from "axios";
import SlotEditModal from "./SlotEditModal";
import VersionHistory from "./VersionHistory";

const EditTimetable = () => {
	const {id} = useParams();
	const navigate = useNavigate();
	const [timetable, setTimetable] = useState(null);
	const [originalTimetable, setOriginalTimetable] = useState(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");
	const [hasChanges, setHasChanges] = useState(false);
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [selectedSlot, setSelectedSlot] = useState(null);
	const [saving, setSaving] = useState(false);
	const [validationErrors, setValidationErrors] = useState([]);
	const [showHistory, setShowHistory] = useState(false);

	// Drag and drop states
	const [draggedSlot, setDraggedSlot] = useState(null);
	const [dragOverSlot, setDragOverSlot] = useState(null);
	const [isDragging, setIsDragging] = useState(false);
	const [dragMode, setDragMode] = useState("move"); // 'move' or 'swap'
	const [validDropZones, setValidDropZones] = useState({}); // Track valid/invalid drop zones

	useEffect(() => {
		fetchTimetable();
	}, [id]);

	const fetchTimetable = async () => {
		try {
			const response = await axios.get(
				`http://localhost:5000/timetables/${id}`
			);
			setTimetable(response.data);
			setOriginalTimetable(JSON.parse(JSON.stringify(response.data))); // Deep clone
			setLoading(false);
		} catch (error) {
			console.error("Error fetching timetable:", error);
			setError("Failed to load timetable");
			setLoading(false);
		}
	};

	const handleSlotClick = (dayIndex, slotIndex) => {
		// Don't open modal if we're dragging
		if (isDragging) return;

		const currentContent = timetable.schedule[dayIndex][slotIndex] || [];
		setSelectedSlot({
			day: dayIndex,
			slot: slotIndex,
			dayName: dayNames[dayIndex],
			timeSlot: slotTimes[slotIndex],
			currentContent: currentContent,
		});
		setIsModalOpen(true);
	};

	const handleSaveSlot = async (slotData) => {
		// Validate the slot change with backend if it's a class
		if (slotData.content.length > 0 && !slotData.content[0].event) {
			try {
				const validation = await axios.post(
					`http://localhost:5000/timetables/${id}/validate-slot`,
					{
						day: slotData.day,
						slot: slotData.slot,
						proposedData: slotData.content[0],
					}
				);

				// Check for errors (not warnings)
				const errors = validation.data.conflicts.filter(
					(c) => c.severity !== "warning"
				);
				const warnings = validation.data.conflicts.filter(
					(c) => c.severity === "warning"
				);

				if (errors.length > 0) {
					// Show conflicts and don't save
					setValidationErrors(errors);
					alert(
						"Conflicts detected! Cannot save this change." +
							errors.map((e) => `• ${e.message}`).join("")
					);
					return;
				}

				if (warnings.length > 0) {
					// Show warnings but allow save
					const proceed = window.confirm(
						"Warnings detected:" +
							warnings.map((w) => `• ${w.message}`).join("") +
							"Do you want to proceed anyway?"
					);
					if (!proceed) return;
				}
			} catch (error) {
				console.error("Error validating slot:", error);
				alert("Failed to validate changes. Please try again.");
				return;
			}
		}

		// Update local state
		const updatedTimetable = {...timetable};
		updatedTimetable.schedule[slotData.day][slotData.slot] = slotData.content;
		setTimetable(updatedTimetable);
		setHasChanges(true);
		setValidationErrors([]);
	};

	// Validate all possible drop zones when drag starts
	const validateAllDropZones = async (sourceDay, sourceSlot, sourceContent) => {
		const zones = {};

		// Check all slots
		for (let day = 0; day < 5; day++) {
			for (let slot = 0; slot < 8; slot++) {
				// Skip same slot
				if (day === sourceDay && slot === sourceSlot) {
					zones[`${day}-${slot}`] = {valid: false, reason: "same_slot"};
					continue;
				}

				// Skip lunch break
				if (slot === 4) {
					zones[`${day}-${slot}`] = {valid: false, reason: "lunch_break"};
					continue;
				}

				// If source has class content, validate it
				if (sourceContent.length > 0 && !sourceContent[0].event) {
					try {
						const validation = await axios.post(
							`http://localhost:5000/timetables/${id}/validate-slot`,
							{
								day: day,
								slot: slot,
								proposedData: sourceContent[0],
							}
						);

						const errors = validation.data.conflicts.filter(
							(c) => c.severity !== "warning"
						);
						zones[`${day}-${slot}`] = {
							valid: errors.length === 0,
							reason: errors.length > 0 ? errors[0].type : null,
							message: errors.length > 0 ? errors[0].message : null,
						};
					} catch (error) {
						console.error("Error validating zone:", error);
						zones[`${day}-${slot}`] = {valid: false, reason: "error"};
					}
				} else {
					// Events and free slots can be moved anywhere
					zones[`${day}-${slot}`] = {valid: true, reason: null};
				}
			}
		}

		setValidDropZones(zones);
	};

	// Drag and drop handlers
	const handleDragStart = async (e, dayIndex, slotIndex) => {
		e.stopPropagation();
		const slotContent = timetable.schedule[dayIndex][slotIndex];

		// Only allow dragging if slot has content
		if (!slotContent || slotContent.length === 0) {
			e.preventDefault();
			return;
		}

		setIsDragging(true);
		setDraggedSlot({day: dayIndex, slot: slotIndex, content: slotContent});

		// Set drag image
		e.dataTransfer.effectAllowed = "move";
		e.dataTransfer.setData("text/html", e.target.innerHTML);

		// Validate all drop zones
		await validateAllDropZones(dayIndex, slotIndex, slotContent);
	};

	const handleDragEnd = (e) => {
		e.stopPropagation();
		setIsDragging(false);
		setDraggedSlot(null);
		setDragOverSlot(null);
		setValidDropZones({}); // Clear validation when drag ends
	};

	const handleDragOver = (e, dayIndex, slotIndex) => {
		e.preventDefault();
		e.stopPropagation();

		// Don't allow dropping on the same slot
		if (
			draggedSlot &&
			draggedSlot.day === dayIndex &&
			draggedSlot.slot === slotIndex
		) {
			e.dataTransfer.dropEffect = "none";
			return;
		}

		// Don't allow dropping on lunch break (slot 4)
		if (slotIndex === 4) {
			e.dataTransfer.dropEffect = "none";
			return;
		}

		e.dataTransfer.dropEffect = "move";
		setDragOverSlot({day: dayIndex, slot: slotIndex});
	};

	const handleDragLeave = (e) => {
		e.stopPropagation();
		setDragOverSlot(null);
	};

	const handleDrop = async (e, targetDay, targetSlot) => {
		e.preventDefault();
		e.stopPropagation();

		if (!draggedSlot) return;

		// Check if drop zone is valid
		const zoneKey = `${targetDay}-${targetSlot}`;
		const dropZoneInfo = validDropZones[zoneKey];

		if (dropZoneInfo && !dropZoneInfo.valid) {
			alert(`Cannot drop here!

Reason: ${dropZoneInfo.message || "Invalid drop zone"}`);
			setDragOverSlot(null);
			return;
		}

		const targetContent = timetable.schedule[targetDay][targetSlot];
		const sourceContent = draggedSlot.content;

		// If target has content and source has content, it's a swap
		if (targetContent && targetContent.length > 0 && sourceContent.length > 0) {
			// Swap mode - validate both directions
			if (!targetContent[0].event) {
				try {
					const validation = await axios.post(
						`http://localhost:5000/timetables/${id}/validate-slot`,
						{
							day: draggedSlot.day,
							slot: draggedSlot.slot,
							proposedData: targetContent[0],
						}
					);

					const errors = validation.data.conflicts.filter(
						(c) => c.severity !== "warning"
					);
					if (errors.length > 0) {
						alert(
							"Cannot swap: Target content conflicts when moved to source position." +
								errors.map((e) => `• ${e.message}`).join("")
						);
						setDragOverSlot(null);
						return;
					}
				} catch (error) {
					console.error("Error validating swap:", error);
					alert("Failed to validate swap. Please try again.");
					setDragOverSlot(null);
					return;
				}
			}

			// Perform swap
			const updatedSchedule = JSON.parse(JSON.stringify(timetable.schedule));
			updatedSchedule[targetDay][targetSlot] = sourceContent;
			updatedSchedule[draggedSlot.day][draggedSlot.slot] = targetContent;

			setTimetable({...timetable, schedule: updatedSchedule});
			setHasChanges(true);
		} else {
			// Move mode - just move the content
			const updatedSchedule = JSON.parse(JSON.stringify(timetable.schedule));
			updatedSchedule[targetDay][targetSlot] = sourceContent;
			updatedSchedule[draggedSlot.day][draggedSlot.slot] = [];

			setTimetable({...timetable, schedule: updatedSchedule});
			setHasChanges(true);
		}

		setDragOverSlot(null);
	};

	const handleSaveChanges = async () => {
		if (
			!window.confirm(
				"Save all changes to the database? This will create a new version in the history."
			)
		) {
			return;
		}

		try {
			setSaving(true);
			setError("");

			// Get user ID from localStorage (assuming it's stored during login)
			const userData = JSON.parse(localStorage.getItem("user") || "{}");
			const userId = userData.id || userData._id;

			const response = await axios.put(
				`http://localhost:5000/timetables/${id}/edit`,
				{
					schedule: timetable.schedule,
					changes: "Manual edits via timetable editor",
					userId: userId,
				}
			);

			setSaving(false);
			setHasChanges(false);
			setValidationErrors([]);

			// Update timetable with response data
			setTimetable(response.data.timetable);
			setOriginalTimetable(JSON.parse(JSON.stringify(response.data.timetable)));

			alert(
				"✅ Timetable saved successfully! Version " +
					response.data.timetable.currentVersion
			);
		} catch (error) {
			console.error("Error saving timetable:", error);
			setSaving(false);
			setError("Failed to save changes. Please try again.");
			alert(
				"❌ Failed to save changes: " +
					(error.response?.data?.message || error.message)
			);
		}
	};

	const handleRevert = () => {
		if (window.confirm("Are you sure you want to revert all changes?")) {
			setTimetable(JSON.parse(JSON.stringify(originalTimetable)));
			setHasChanges(false);
		}
	};

	const handleVersionRevert = (updatedTimetable) => {
		// Update state with reverted timetable
		setTimetable(updatedTimetable);
		setOriginalTimetable(JSON.parse(JSON.stringify(updatedTimetable)));
		setHasChanges(false);
	};

	const dayNames = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
	const slotTimes = [
		"09:00-10:00",
		"10:00-11:00",
		"11:00-12:00",
		"12:00-13:00",
		"13:00-14:00",
		"14:00-15:00",
		"15:00-16:00",
		"16:00-17:00",
	];

	if (loading) {
		return (
			<div className="min-h-screen bg-gray-100 flex items-center justify-center">
				<div className="text-center">
					<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
					<p className="mt-4 text-gray-600">Loading timetable...</p>
				</div>
			</div>
		);
	}

	if (error) {
		return (
			<div className="min-h-screen bg-gray-100 flex items-center justify-center">
				<div className="text-center">
					<p className="text-red-600 mb-4">{error}</p>
					<button
						onClick={() => navigate("/view-timetables")}
						className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
					>
						Back to Timetables
					</button>
				</div>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-gray-100">
			{/* Header */}
			<nav className="bg-white shadow-sm">
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
					<div className="flex justify-between h-16 items-center">
						<div className="flex items-center">
							<button
								onClick={() => navigate("/view-timetables")}
								className="text-indigo-600 hover:text-indigo-800 mr-4"
							>
								← Back to Timetables
							</button>
							<h1 className="text-xl font-bold text-gray-900">
								Edit Timetable
							</h1>
						</div>
					</div>
				</div>
			</nav>

			{/* Info Banner */}
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
				<div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
					<div className="flex justify-between items-start">
						<div className="flex-1">
							<h2 className="text-lg font-semibold text-gray-900">
								{timetable?.class?.name || "Timetable"}
							</h2>
							<p className="text-sm text-gray-600 mt-1">
								{timetable?.class?.program?.department?.name} •{" "}
								{timetable?.class?.program?.name}
							</p>
							<p className="text-sm text-gray-600">
								Semester {timetable?.semester} • Section{" "}
								{timetable?.class?.section} • {timetable?.academicYear}
							</p>
							<div className="mt-2">
								<span
									className={`inline-block px-3 py-1 text-sm rounded-full ${
										hasChanges
											? "bg-yellow-100 text-yellow-800"
											: "bg-green-100 text-green-800"
									}`}
								>
									{hasChanges ? "MODIFIED (Unsaved Changes)" : "No Changes"}
								</span>
								{timetable?.isEdited && (
									<span className="ml-2 inline-block px-3 py-1 text-sm rounded-full bg-purple-100 text-purple-800">
										Manually Edited
									</span>
								)}
								{isDragging && (
									<span className="ml-2 inline-block px-3 py-1 text-sm rounded-full bg-blue-100 text-blue-800 animate-pulse">
										🖐️ Dragging...
									</span>
								)}
							</div>
							{isDragging && (
								<div className="mt-2 flex items-center gap-4 text-sm">
									<div className="flex items-center gap-2">
										<div className="w-4 h-4 bg-green-200 border-2 border-green-500 rounded"></div>
										<span className="text-gray-700">Valid drop zones</span>
									</div>
									<div className="flex items-center gap-2">
										<div className="w-4 h-4 bg-red-200 border-2 border-red-500 rounded"></div>
										<span className="text-gray-700">
											Invalid drop zones (conflicts)
										</span>
									</div>
								</div>
							)}
						</div>
						<div className="flex gap-2">
							<button
								onClick={() => setShowHistory(true)}
								className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 flex items-center gap-2"
							>
								<svg
									className="w-4 h-4"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
								>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth={2}
										d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
									/>
								</svg>
								View History
							</button>
							<button
								onClick={handleRevert}
								disabled={!hasChanges}
								className={`px-4 py-2 rounded ${
									hasChanges
										? "bg-yellow-600 text-white hover:bg-yellow-700"
										: "bg-gray-300 text-gray-500 cursor-not-allowed"
								}`}
							>
								Revert Changes
							</button>
							<button
								onClick={() => {
									if (
										hasChanges &&
										!window.confirm(
											"You have unsaved changes. Are you sure you want to cancel?"
										)
									) {
										return;
									}
									navigate("/view-timetables");
								}}
								className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
							>
								Cancel
							</button>
							<button
								onClick={handleSaveChanges}
								disabled={!hasChanges || saving}
								className={`px-4 py-2 rounded flex items-center gap-2 ${
									hasChanges && !saving
										? "bg-green-600 text-white hover:bg-green-700"
										: "bg-gray-300 text-gray-500 cursor-not-allowed"
								}`}
							>
								{saving && (
									<div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
								)}
								{saving ? "Saving..." : "Save Changes"}
							</button>
						</div>
					</div>
				</div>
			</div>

			{/* Instructions */}
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-4">
				{validationErrors.length > 0 && (
					<div className="bg-red-50 border-l-4 border-red-400 p-4 mb-4 rounded">
						<div className="flex">
							<div className="shrink-0">
								<svg
									className="h-5 w-5 text-red-400"
									viewBox="0 0 20 20"
									fill="currentColor"
								>
									<path
										fillRule="evenodd"
										d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
										clipRule="evenodd"
									/>
								</svg>
							</div>
							<div className="ml-3">
								<h3 className="text-sm font-medium text-red-800">
									Validation Errors
								</h3>
								<div className="mt-2 text-sm text-red-700">
									<ul className="list-disc list-inside space-y-1">
										{validationErrors.map((err, idx) => (
											<li key={idx}>{err.message}</li>
										))}
									</ul>
								</div>
							</div>
						</div>
					</div>
				)}
				<div className="bg-white rounded-lg shadow p-4">
					<h3 className="font-semibold text-gray-900 mb-2">
						📝 Editing Instructions
					</h3>
					<ul className="text-sm text-gray-600 space-y-1">
						<li>
							• <strong>Click</strong> on any cell to manually edit the slot
						</li>
						<li>
							• <strong>Drag and Drop</strong> to move or swap classes:
							<ul className="ml-6 mt-1 space-y-0.5">
								<li>
									- Drag to an <strong>empty slot</strong> to{" "}
									<span className="text-green-600 font-semibold">move</span> the
									class
								</li>
								<li>
									- Drag to an <strong>occupied slot</strong> to{" "}
									<span className="text-blue-600 font-semibold">swap</span> the
									classes
								</li>
								<li>
									-{" "}
									<span className="bg-green-100 px-2 py-0.5 rounded">
										Green zones
									</span>{" "}
									= Valid drop locations
								</li>
								<li>
									-{" "}
									<span className="bg-red-100 px-2 py-0.5 rounded">
										Red zones
									</span>{" "}
									= Invalid (conflicts detected)
								</li>
								<li>- Cannot drag to lunch break slot (13:00-14:00)</li>
							</ul>
						</li>
						<li>
							• System validates all changes to prevent conflicts (teacher/room
							clashes)
						</li>
						<li>• Changes are saved as a new version for history tracking</li>
					</ul>
				</div>
			</div>

			{/* Timetable Grid */}
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
				<div className="bg-white shadow rounded-lg overflow-hidden">
					<div className="overflow-x-auto">
						<table className="min-w-full border-collapse border border-gray-300">
							<thead>
								<tr className="bg-gray-50">
									<th className="border border-gray-300 px-4 py-2 text-left font-semibold">
										Time
									</th>
									{dayNames.map((day, index) => (
										<th
											key={index}
											className="border border-gray-300 px-4 py-2 text-center font-semibold"
										>
											{day}
										</th>
									))}
								</tr>
							</thead>
							<tbody>
								{slotTimes.map((time, slotIndex) => (
									<tr key={slotIndex}>
										<td className="border border-gray-300 px-4 py-2 font-medium bg-gray-50">
											{time}
										</td>
										{timetable?.schedule.map((daySchedule, dayIndex) => {
											const isLunchBreak = slotIndex === 4;
											const isBeingDraggedOver =
												dragOverSlot?.day === dayIndex &&
												dragOverSlot?.slot === slotIndex;
											const isBeingDragged =
												draggedSlot?.day === dayIndex &&
												draggedSlot?.slot === slotIndex;
											const hasContent = daySchedule[slotIndex]?.length > 0;

											// Check if this slot is a valid drop zone
											const zoneKey = `${dayIndex}-${slotIndex}`;
											const dropZoneInfo = validDropZones[zoneKey];
											const isValidDrop = dropZoneInfo?.valid === true;
											const isInvalidDrop = dropZoneInfo?.valid === false;

											return (
												<td
													key={dayIndex}
													className={`border border-gray-300 px-2 py-2 transition-all ${
														isLunchBreak
															? "bg-orange-50 cursor-not-allowed"
															: isBeingDragged
															? "opacity-50 bg-gray-100"
															: isDragging
															? isValidDrop
																? isBeingDraggedOver
																	? "bg-green-200 border-4 border-green-500 cursor-pointer" // Valid + hovering
																	: "bg-green-50 border-2 border-green-300 cursor-pointer" // Valid drop zone
																: isInvalidDrop
																? isBeingDraggedOver
																	? "bg-red-200 border-4 border-red-500 cursor-not-allowed" // Invalid + hovering
																	: "bg-red-50 border-2 border-red-300 cursor-not-allowed" // Invalid drop zone
																: "bg-gray-100 cursor-default" // Not validated yet
															: hasContent
															? "hover:bg-indigo-50 cursor-move"
															: "hover:bg-gray-50 cursor-pointer"
													}`}
													draggable={!isLunchBreak && hasContent}
													onDragStart={(e) =>
														handleDragStart(e, dayIndex, slotIndex)
													}
													onDragEnd={handleDragEnd}
													onDragOver={(e) =>
														handleDragOver(e, dayIndex, slotIndex)
													}
													onDragLeave={handleDragLeave}
													onDrop={(e) => handleDrop(e, dayIndex, slotIndex)}
													onClick={() =>
														!isDragging && handleSlotClick(dayIndex, slotIndex)
													}
												>
													{daySchedule[slotIndex]?.length > 0 ? (
														daySchedule[slotIndex].map((entry, entryIndex) => (
															<div
																key={entryIndex}
																className={`mb-1 p-2 rounded text-sm relative group ${
																	entry.event
																		? "bg-yellow-100 text-yellow-800 font-semibold text-center"
																		: "bg-blue-50 border-l-4 border-blue-500"
																}`}
															>
																{/* Drag handle icon */}
																{!isLunchBreak && (
																	<div className="absolute top-1 left-1 opacity-0 group-hover:opacity-100 transition-opacity">
																		<svg
																			className="w-4 h-4 text-gray-500"
																			fill="currentColor"
																			viewBox="0 0 20 20"
																		>
																			<path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
																		</svg>
																	</div>
																)}
																{/* Edit icon appears on hover */}
																<div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
																	<svg
																		className="w-4 h-4 text-indigo-600"
																		fill="none"
																		stroke="currentColor"
																		viewBox="0 0 24 24"
																	>
																		<path
																			strokeLinecap="round"
																			strokeLinejoin="round"
																			strokeWidth={2}
																			d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
																		/>
																	</svg>
																</div>
																{entry.event ? (
																	<div>{entry.event}</div>
																) : (
																	<>
																		<div className="font-semibold text-blue-900">
																			{entry.subject}
																		</div>
																		<div className="text-xs text-gray-600">
																			{entry.teacher}
																		</div>
																		<div className="text-xs text-gray-500">
																			{entry.classroom}
																		</div>
																	</>
																)}
															</div>
														))
													) : isLunchBreak ? (
														<div className="text-center text-orange-600 font-semibold text-sm h-20 flex items-center justify-center">
															🍽️ Lunch Break
														</div>
													) : (
														<div className="text-center text-gray-400 text-sm h-20 flex items-center justify-center">
															<span
																className={
																	isDragging
																		? isValidDrop
																			? "text-green-600 font-semibold"
																			: isInvalidDrop
																			? "text-red-600 font-semibold"
																			: ""
																		: ""
																}
															>
																{isDragging
																	? isValidDrop
																		? "✓ Drop here"
																		: isInvalidDrop
																		? "✗ Cannot drop"
																		: "Free"
																	: "Free"}
															</span>
														</div>
													)}
												</td>
											);
										})}
									</tr>
								))}
							</tbody>
						</table>
					</div>
				</div>
			</div>

			{/* Slot Edit Modal */}
			{selectedSlot && (
				<SlotEditModal
					isOpen={isModalOpen}
					onClose={() => setIsModalOpen(false)}
					slotData={selectedSlot}
					timetableData={timetable}
					onSave={handleSaveSlot}
				/>
			)}

			{/* Version History Modal */}
			{showHistory && (
				<VersionHistory
					timetableId={id}
					onClose={() => setShowHistory(false)}
					onRevert={handleVersionRevert}
				/>
			)}
		</div>
	);
};

export default EditTimetable;
