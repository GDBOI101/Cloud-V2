#include "pch.h"
#include "VHook.h"

#define XIP Rip

uintptr_t VHook::pTarget = 0;
uintptr_t VHook::pDetour = 0;

PVOID VHook::hHandle = nullptr;

DWORD VHook::dwProtect = 0;

BOOL VHook::Hook(uintptr_t pTarget = 0, uintptr_t pDetour = 0)
{
	if (pTarget != 0)
		VHook::pTarget = pTarget;
	if (pDetour != 0)
		VHook::pDetour = pDetour;

	if (IsSamePage((const uint8_t*)pTarget, (const uint8_t*)pDetour))
		return false;

	hHandle = AddVectoredExceptionHandler(true, (PVECTORED_EXCEPTION_HANDLER)Handler);

	if (hHandle && VirtualProtect((LPVOID)pTarget, 1, PAGE_EXECUTE_READ | PAGE_GUARD, &dwProtect))
		return true;

	return false;
}

BOOL VHook::Unhook()
{
	DWORD dwOldProtect;

	if (hHandle && VirtualProtect((LPVOID)pTarget, 1, dwProtect, &dwOldProtect) && RemoveVectoredExceptionHandler(hHandle))
		return true;

	return false;
}

LONG WINAPI VHook::Handler(EXCEPTION_POINTERS* pExceptionInfo)
{
	DWORD dwOldProtect;

	switch (pExceptionInfo->ExceptionRecord->ExceptionCode) {
	case STATUS_GUARD_PAGE_VIOLATION:
		if (pExceptionInfo->ContextRecord->XIP == (uintptr_t)pTarget)
			pExceptionInfo->ContextRecord->XIP = (uintptr_t)pDetour;

		pExceptionInfo->ContextRecord->EFlags |= 0x100;

		return EXCEPTION_CONTINUE_EXECUTION;

	case STATUS_SINGLE_STEP:
		VirtualProtect((LPVOID)pTarget, 1, PAGE_EXECUTE_READ | PAGE_GUARD, &dwOldProtect);

		return EXCEPTION_CONTINUE_EXECUTION;
	}

	return EXCEPTION_CONTINUE_SEARCH;
}

BOOL VHook::IsSamePage(const uint8_t* pFirstAddress, const uint8_t* pSecondAddress)
{
	MEMORY_BASIC_INFORMATION mbiFirst, mbiSecond;

	if (!VirtualQuery(pFirstAddress, &mbiFirst, sizeof(mbiFirst)))
		return true;
	if (!VirtualQuery(pSecondAddress, &mbiSecond, sizeof(mbiSecond)))
		return true;

	if (mbiFirst.BaseAddress == mbiSecond.BaseAddress)
		return true;

	return false;
}
