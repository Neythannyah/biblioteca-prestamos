import React, { createContext, useContext } from 'react'

const TabsContext = createContext({
  activeTab: '',
  setActiveTab: () => {}
})

export function Tabs({ defaultValue, value, onValueChange, children, className = '' }) {
  const [internalTab, setInternalTab] = React.useState(defaultValue)
  const activeTab = value !== undefined ? value : internalTab
  const setActiveTab = onValueChange || setInternalTab

  return (
    <TabsContext.Provider value={{ activeTab, setActiveTab }}>
      <div className={`w-full ${className}`}>{children}</div>
    </TabsContext.Provider>
  )
}

export function TabsList({ children, className = '' }) {
  return (
    <div
      className={`inline-flex items-center gap-1.5 p-1.5 rounded-full bg-muted/80 border border-border/60 ${className}`}
    >
      {children}
    </div>
  )
}

export function TabsTrigger({ value, children, className = '', disabled = false }) {
  const { activeTab, setActiveTab } = useContext(TabsContext)
  const isSelected = activeTab === value

  return (
    <button
      type="button"
      role="tab"
      disabled={disabled}
      aria-selected={isSelected}
      onClick={() => setActiveTab(value)}
      className={`inline-flex items-center justify-center whitespace-nowrap rounded-full px-4 py-1.5 text-xs font-medium transition-all duration-150 ${
        isSelected
          ? 'bg-card text-foreground shadow-subtle border border-border/80 font-semibold'
          : 'text-muted-foreground hover:text-foreground hover:bg-card/50'
      } disabled:opacity-50 ${className}`}
    >
      {children}
    </button>
  )
}

export function TabsContent({ value, children, className = '' }) {
  const { activeTab } = useContext(TabsContext)
  if (activeTab !== value) return null

  return (
    <div role="tabpanel" className={`mt-4 outline-none animate-in fade-in-50 duration-150 ${className}`}>
      {children}
    </div>
  )
}

