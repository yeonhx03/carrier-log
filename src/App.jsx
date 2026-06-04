import { useState } from 'react'
import './App.css'
import AuthScreen from './components/AuthScreen'
import ExportScreen from './components/ExportScreen'
import HistoryCompanyTable from './components/HistoryCompanyTable'
import HistoryScreen from './components/HistoryScreen'
import HomeScreen from './components/HomeScreen'
import LogDetailView from './components/LogDetailView'
import LogInputForm from './components/LogInputForm'
import SettlementScreen from './components/SettlementScreen'
import SettingsPanel from './components/SettingsPanel'
import { useAppData } from './hooks/useAppData'
import { useAuthAccount } from './hooks/useAuthAccount'
import { useExportController } from './hooks/useExportController'
import { useHistoryController } from './hooks/useHistoryController'
import { useSettingsController } from './hooks/useSettingsController'
import { useSettlementController } from './hooks/useSettlementController'
import { getMonthLabel } from './utils/date'
import { isFirebaseConfigured } from './utils/cloudStore'
import { getCompanyName } from './utils/logSelectors'

function App() {
  const [screen, setScreen] = useState('home')
  const authAccount = useAuthAccount()
  const appData = useAppData(authAccount.firebaseUserId)
  const history = useHistoryController({
    logs: appData.logs,
    setLogs: appData.setLogs,
    companies: appData.companies,
    setScreen,
  })
  const exportController = useExportController({
    logs: appData.logs,
    companies: appData.companies,
    setScreen,
  })
  const settlement = useSettlementController({
    logs: appData.logs,
    companies: appData.companies,
    noteCategories: appData.noteCategories,
    settlementFixedDeduction: appData.settlementFixedDeduction,
    settlementAccounts: appData.settlementAccounts,
    setSettlementAccounts: appData.setSettlementAccounts,
    setSettlementAccountTemplates: appData.setSettlementAccountTemplates,
    setSettlementRequestTemplates: appData.setSettlementRequestTemplates,
    setScreen,
  })
  const settings = useSettingsController({
    companies: appData.companies,
    setCompanies: appData.setCompanies,
    noteCategories: appData.noteCategories,
    setNoteCategories: appData.setNoteCategories,
    setLogs: appData.setLogs,
    setSettlementFixedDeduction: appData.setSettlementFixedDeduction,
  })

  const resetDeletedAccountState = () => {
    appData.resetUserData()
    history.clearHistorySelection()
    settlement.setSettlementRequest('')
    setScreen('home')
  }

  const handleDeleteAccount = () => {
    authAccount.handleDeleteAccount({
      firebaseUserId: authAccount.firebaseUserId,
      isDeletingAccountRef: appData.isDeletingAccountRef,
      resetUserData: resetDeletedAccountState,
      onAfterDelete: settings.closeSettings,
    })
  }

  const renderHistoryScreen = () => {
    if (history.selectedLog) {
      if (history.isEditingLog) {
        return (
          <LogInputForm
            companies={appData.companies}
            logs={appData.logs}
            noteCategories={appData.noteCategories}
            initialLog={history.selectedLog}
            onUpdateLog={history.handleUpdateLog}
            onBack={() => history.setIsEditingLog(false)}
          />
        )
      }

      return (
        <LogDetailView
          log={history.selectedLog}
          companyName={getCompanyName(
            appData.companies,
            history.selectedLog.companyId,
            history.selectedLog.companyName,
          )}
          onBack={() => {
            history.setSelectedLogId(null)
            history.setIsEditingLog(false)
          }}
          onEdit={() => history.setIsEditingLog(true)}
          onDelete={() => history.handleDeleteLog(history.selectedLog.id)}
        />
      )
    }

    if (history.selectedHistoryCompanyId) {
      const monthGroup = history.historyGroups.find(
        (group) => group.key === history.selectedHistoryGroupKey,
      )
      const companyGroup = monthGroup?.companies.find(
        (item) => item.companyId === history.selectedHistoryCompanyId,
      )

      if (monthGroup && companyGroup) {
        return (
          <HistoryCompanyTable
            monthGroup={monthGroup}
            companyGroup={companyGroup}
            onSelectLog={(logId) => {
              history.setSelectedLogId(logId)
              history.setIsEditingLog(false)
            }}
            onBack={history.clearHistorySelection}
          />
        )
      }
    }

    return (
      <HistoryScreen
        historyGroups={history.historyGroups}
        isSearchOpen={history.isHistorySearchOpen}
        searchType={history.historySearchType}
        searchValue={history.historySearch}
        selectedMonth={history.selectedHistoryMonth}
        availableMonths={history.availableMonths}
        onToggleSearch={() =>
          history.setIsHistorySearchOpen((value) => !value)
        }
        onChangeSearchType={history.handleChangeSearchType}
        onChangeSearchValue={history.handleChangeSearchValue}
        onChangeMonth={history.handleChangeMonth}
        onSelectCompany={history.handleSelectCompany}
        onBack={() => setScreen('home')}
      />
    )
  }

  const renderExportScreen = () => (
    <ExportScreen
      exportStep={exportController.exportStep}
      exportMonths={exportController.exportMonths}
      selectedExportMonth={exportController.selectedExportMonth}
      exportFormat={exportController.exportFormat}
      exportMode={exportController.exportMode}
      exportGroups={exportController.exportGroups}
      selectedExportCompanyId={exportController.selectedExportCompanyId}
      selectedCompanyGroups={exportController.selectedCompanyGroups}
      monthLabel={getMonthLabel(exportController.selectedExportMonth)}
      onChangeMonth={exportController.setSelectedExportMonth}
      onChangeFormat={exportController.setExportFormat}
      onNext={() => exportController.setExportStep('mode')}
      onChangeMode={exportController.handleChangeMode}
      onChangeCompany={exportController.setSelectedExportCompanyId}
      onRunExport={exportController.runExport}
      onBack={exportController.handleBack}
    />
  )

  const renderSettlementScreen = () => (
    <SettlementScreen
      months={settlement.settlementMonths}
      selectedMonth={settlement.selectedSettlementMonth}
      format={settlement.settlementFormat}
      noteCategories={appData.noteCategories}
      summary={settlement.settlementSummary}
      logsCount={settlement.settlementLogs.length}
      step={settlement.settlementStep}
      accounts={appData.settlementAccounts}
      accountTemplates={appData.settlementAccountTemplates}
      requestText={settlement.settlementRequest}
      requestTemplates={appData.settlementRequestTemplates}
      onChangeMonth={settlement.setSelectedSettlementMonth}
      onChangeFormat={settlement.setSettlementFormat}
      onNext={() => settlement.setSettlementStep('accounts')}
      onUpdateAccount={settlement.handleUpdateSettlementAccount}
      onAddAccount={settlement.handleAddSettlementAccount}
      onDeleteAccount={settlement.handleDeleteSettlementAccount}
      onSaveAccountList={settlement.handleSaveSettlementAccountList}
      onUseAccountTemplate={settlement.handleUseSettlementAccountTemplate}
      onStartNewAccountList={settlement.handleStartNewSettlementAccountList}
      onChangeRequestText={settlement.setSettlementRequest}
      onUseRequestTemplate={settlement.setSettlementRequest}
      onRunExport={settlement.runSettlementExport}
      onBack={settlement.handleBack}
    />
  )

  const renderAppScreen = () => {
    if (screen === 'home') {
      return (
        <HomeScreen
          logsCount={appData.logs.length}
          onInput={() => setScreen('input')}
          onHistory={history.openHistory}
          onExport={exportController.openExport}
          onSettlement={settlement.openSettlement}
          onSettings={settings.openSettings}
        />
      )
    }

    if (screen === 'input') {
      return (
        <LogInputForm
          companies={appData.companies}
          logs={appData.logs}
          noteCategories={appData.noteCategories}
          onAddLog={history.handleAddLog}
          onBack={() => setScreen('home')}
        />
      )
    }

    if (screen === 'history') {
      return renderHistoryScreen()
    }

    if (screen === 'export') {
      return renderExportScreen()
    }

    if (screen === 'settlement') {
      return renderSettlementScreen()
    }

    return null
  }

  const canUseApp =
    !isFirebaseConfigured ||
    authAccount.firebaseUser ||
    authAccount.isLocalOnlyMode

  return (
    <main className="app-shell">
      <div className="phone-frame">
        {isFirebaseConfigured &&
          !authAccount.firebaseUser &&
          !authAccount.isLocalOnlyMode && (
            <AuthScreen
              errorMessage={authAccount.authErrorMessage}
              isLoading={authAccount.isAuthLoading}
              onGoogleSignIn={authAccount.handleGoogleSignIn}
              onStartLocalOnly={authAccount.handleStartLocalOnly}
            />
          )}
        {canUseApp && renderAppScreen()}
      </div>

      {settings.isSettingOpen && (
        <SettingsPanel
          section={settings.settingSection}
          currentUser={authAccount.firebaseUser}
          isLocalOnlyMode={authAccount.isLocalOnlyMode}
          isDeletingAccount={authAccount.isDeletingAccount}
          deleteAccountError={authAccount.deleteAccountError}
          companies={appData.companies}
          noteCategories={appData.noteCategories}
          fixedDeduction={appData.settlementFixedDeduction}
          newCompanyName={settings.newCompanyName}
          newNoteCategoryName={settings.newNoteCategoryName}
          newNoteCategoryPrice={settings.newNoteCategoryPrice}
          onClose={settings.closeSettings}
          onChangeSection={settings.setSettingSection}
          onGoogleSignIn={authAccount.handleGoogleSignIn}
          onSignOut={() => authAccount.handleSignOut(settings.closeSettings)}
          onDeleteAccount={handleDeleteAccount}
          onChangeNewCompanyName={settings.setNewCompanyName}
          onAddCompany={settings.handleAddCompany}
          onRenameCompany={settings.handleRenameCompany}
          onDeleteCompany={settings.handleDeleteCompany}
          onChangeNewNoteCategoryName={settings.setNewNoteCategoryName}
          onChangeNewNoteCategoryPrice={settings.setNewNoteCategoryPrice}
          onAddNoteCategory={settings.handleAddNoteCategory}
          onUpdateNoteCategory={settings.handleUpdateNoteCategory}
          onUpdateDefaultUnitPrice={settings.handleUpdateDefaultUnitPrice}
          onUpdateFixedDeduction={settings.handleUpdateFixedDeduction}
          onDeleteNoteCategory={settings.handleDeleteNoteCategory}
        />
      )}
    </main>
  )
}

export default App
