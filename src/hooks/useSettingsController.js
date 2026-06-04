import { useState } from 'react'
import { createCompanyId } from '../utils/companies'

export function useSettingsController({
  companies,
  setCompanies,
  noteCategories,
  setNoteCategories,
  setLogs,
  setSettlementFixedDeduction,
}) {
  const [isSettingOpen, setIsSettingOpen] = useState(false)
  const [settingSection, setSettingSection] = useState('menu')
  const [newCompanyName, setNewCompanyName] = useState('')
  const [newNoteCategoryName, setNewNoteCategoryName] = useState('')
  const [newNoteCategoryPrice, setNewNoteCategoryPrice] = useState('')

  const openSettings = () => setIsSettingOpen(true)

  const closeSettings = () => {
    setIsSettingOpen(false)
    setSettingSection('menu')
  }

  const handleAddCompany = () => {
    const trimmedName = newCompanyName.trim()

    if (!trimmedName) {
      return
    }

    if (companies.some((company) => company.name === trimmedName)) {
      alert('이미 등록된 보험사입니다.')
      return
    }

    setCompanies((prevCompanies) => [
      ...prevCompanies,
      { id: createCompanyId(trimmedName), name: trimmedName },
    ])
    setNewCompanyName('')
  }

  const handleRenameCompany = (companyId, nextName) => {
    const trimmedName = nextName.trim()

    if (!trimmedName) {
      alert('보험사 이름을 입력해주세요.')
      return
    }

    if (
      companies.some(
        (company) => company.id !== companyId && company.name === trimmedName,
      )
    ) {
      alert('이미 등록된 보험사입니다.')
      return
    }

    setCompanies((prevCompanies) =>
      prevCompanies.map((company) =>
        company.id === companyId ? { ...company, name: trimmedName } : company,
      ),
    )
  }

  const handleDeleteCompany = (companyId) => {
    setCompanies((prevCompanies) =>
      prevCompanies.filter((company) => company.id !== companyId),
    )
  }

  const handleUpdateNoteCategory = (categoryValue, nextName, nextPrice) => {
    const trimmedName = nextName.trim()
    const unitPrice = Number(nextPrice || 0)

    if (categoryValue && !trimmedName) {
      alert('비고 이름을 입력해주세요.')
      return
    }

    if (
      categoryValue &&
      noteCategories.some(
        (category) =>
          category.value !== categoryValue && category.value === trimmedName,
      )
    ) {
      alert('이미 등록된 비고 카테고리입니다.')
      return
    }

    setNoteCategories((prevCategories) =>
      prevCategories.map((category) => {
        if (category.value !== categoryValue) {
          return category
        }

        return {
          ...category,
          value: trimmedName,
          label: trimmedName,
          unitPrice,
        }
      }),
    )

    if (categoryValue && categoryValue !== trimmedName) {
      setLogs((prevLogs) =>
        prevLogs.map((log) =>
          log.note === categoryValue ? { ...log, note: trimmedName } : log,
        ),
      )
    }
  }

  const handleUpdateDefaultUnitPrice = (nextPrice) => {
    setNoteCategories((prevCategories) =>
      prevCategories.map((category) =>
        category.value === ''
          ? { ...category, unitPrice: Number(nextPrice || 0) }
          : category,
      ),
    )
  }

  const handleUpdateFixedDeduction = (nextPrice) => {
    setSettlementFixedDeduction(Number(nextPrice || 0))
  }

  const handleAddNoteCategory = () => {
    const trimmedName = newNoteCategoryName.trim()

    if (!trimmedName) {
      return
    }

    if (noteCategories.some((category) => category.value === trimmedName)) {
      alert('이미 등록된 비고 카테고리입니다.')
      return
    }

    setNoteCategories((prevCategories) => [
      ...prevCategories,
      {
        value: trimmedName,
        label: trimmedName,
        unitPrice: Number(newNoteCategoryPrice || 0),
      },
    ])
    setNewNoteCategoryName('')
    setNewNoteCategoryPrice('')
  }

  const handleDeleteNoteCategory = (categoryValue) => {
    setNoteCategories((prevCategories) =>
      prevCategories.filter((category) => category.value !== categoryValue),
    )
    setLogs((prevLogs) =>
      prevLogs.map((log) =>
        log.note === categoryValue ? { ...log, note: '' } : log,
      ),
    )
  }

  return {
    isSettingOpen,
    settingSection,
    newCompanyName,
    newNoteCategoryName,
    newNoteCategoryPrice,
    openSettings,
    closeSettings,
    setSettingSection,
    setNewCompanyName,
    setNewNoteCategoryName,
    setNewNoteCategoryPrice,
    handleAddCompany,
    handleRenameCompany,
    handleDeleteCompany,
    handleUpdateNoteCategory,
    handleUpdateDefaultUnitPrice,
    handleUpdateFixedDeduction,
    handleAddNoteCategory,
    handleDeleteNoteCategory,
  }
}
