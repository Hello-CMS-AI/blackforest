import React, { useState, useEffect, useRef } from "react";
import { Layout, Button, Space, Row, Col, message, Image, Radio, Badge, Tooltip, InputNumber, Select, Dropdown, Menu, Input, DatePicker, Divider, Input as AntInput } from "antd";
import { LogoutOutlined, ShoppingCartOutlined, MenuOutlined, ArrowLeftOutlined, CheckCircleFilled, PlusOutlined, MinusOutlined, CloseOutlined, WalletOutlined, CreditCardOutlined, FileDoneOutlined, SaveOutlined, PrinterOutlined, UserOutlined } from "@ant-design/icons";
import { useRouter } from "next/router";
import { jwtDecode as jwtDecodeLib } from "jwt-decode";
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

dayjs.extend(utc);
dayjs.extend(timezone);

const { Header, Content, Sider } = Layout;
const { Option } = Select;

const BranchPage = ({ branchId }) => {
  const router = useRouter();
  const [token, setToken] = useState(null);
  const [name, setName] = useState("Branch User");
  const [branchName, setBranchName] = useState("");
  const [activeTab, setActiveTab] = useState("stock");
  const [isCartExpanded, setIsCartExpanded] = useState(false);
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedProductType, setSelectedProductType] = useState(null);
  const [selectedProductsByTab, setSelectedProductsByTab] = useState({ stock: [], billing: [], order: [], liveOrder: [], cake: [], tableOrder: {} });
  const [loading, setLoading] = useState(false);
  const [productsLoading, setProductsLoading] = useState(false);
  const [isPortrait, setIsPortrait] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [contentWidth, setContentWidth] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState(null);
  const [selectedUnits, setSelectedUnits] = useState({});
  const [lastBillNo, setLastBillNo] = useState(null);
  const [cashiers, setCashiers] = useState([]);
  const [managers, setManagers] = useState([]);
  const [waiters, setWaiters] = useState([]);
  const [selectedCashier, setSelectedCashier] = useState(null);
  const [selectedManager, setSelectedManager] = useState(null);
  const [selectedWaiter, setSelectedWaiter] = useState(null);
  const [waiterInput, setWaiterInput] = useState('');
  const [waiterName, setWaiterName] = useState('');
  const [waiterError, setWaiterError] = useState('');
  const [todayAssignment, setTodayAssignment] = useState({});
  const [deliveryDateTime, setDeliveryDateTime] = useState(null);
  const [tableCategories, setTableCategories] = useState([]);
  const [tablesLoading, setTablesLoading] = useState(false);
  const [selectedTable, setSelectedTable] = useState(null);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newTableCount, setNewTableCount] = useState(1);
  // New state for branch inventory
  const [branchInventory, setBranchInventory] = useState([]); // Add this line

  const contentRef = useRef(null);

  const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://api10.theblackforestcakes.com:5000';
  const defaultDeliveryDateTime = dayjs().add(1, 'day').set('hour', 10).set('minute', 0).set('second', 0).tz('Asia/Kolkata');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedToken = localStorage.getItem('token');
      setToken(storedToken);

      if (!storedToken) {
        router.replace('/login');
        return;
      }

      try {
        const decoded = jwtDecodeLib(storedToken);
        if (decoded.role !== 'branch') {
          router.replace('/login');
          return;
        }
        setName(decoded.name || decoded.username || "Branch User");
        setBranchName(`Branch ${branchId.replace('B', '')}`);
      } catch (error) {
        console.error('Error decoding token:', error);
        router.replace('/login');
      }

      fetchBranchDetails(storedToken, branchId);
      fetchCategories(storedToken);
      fetchEmployees(storedToken, 'Cashier', setCashiers);
      fetchEmployees(storedToken, 'Manager', setManagers);
      fetchEmployees(storedToken, 'Waiter', setWaiters);
      fetchTodayAssignment(storedToken);
      fetchTableCategories(storedToken);

      // Fetch branch inventory
      const fetchBranchInventory = async () => {
        try {
          const response = await fetch(`${BACKEND_URL}/api/inventory?locationId=${branchId}`, {
            headers: {
              'Authorization': `Bearer ${storedToken}`,
            },
          });
          const data = await response.json();
          console.log('Branch Inventory Response:', data); // Add this line
          if (response.ok) {
            setBranchInventory(data); // Array of { productId, inStock, ... }
          } else {
            message.error('Failed to fetch branch inventory');
          }
        } catch (error) {
          message.error('Error fetching branch inventory');
        }
      };

      if (branchId && storedToken) {
        fetchBranchInventory(); // Call the fetch function
      }

      setIsMobile(window.innerWidth <= 991);
      setIsPortrait(window.matchMedia("(orientation: portrait)").matches);

      const updateContentWidth = () => {
        if (contentRef.current) {
          setContentWidth(contentRef.current.getBoundingClientRect().width);
        }
      };

      updateContentWidth();
      window.addEventListener("resize", updateContentWidth);

      const handleOrientationChange = (e) => {
        setIsPortrait(e.matches);
        setIsMobileMenuOpen(false);
        updateContentWidth();
      };

      const mediaQuery = window.matchMedia("(orientation: portrait)");
      mediaQuery.addEventListener("change", handleOrientationChange);

      const handleResize = () => {
        setIsMobile(window.innerWidth <= 991);
        updateContentWidth();
      };

      window.addEventListener("resize", handleResize);

      return () => {
        mediaQuery.removeEventListener("change", handleOrientationChange);
        window.removeEventListener("resize", handleResize);
      };
    }
  }, [router, branchId, contentRef.current]);

  // Rest of your existing functions (fetchBranchDetails, fetchCategories, etc.) remain unchanged

  const fetchBranchDetails = async (token) => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/branch/${branchId}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setBranchName(data.name || `Branch ${branchId.replace('B', '')}`);
      } else {
        message.error('Failed to fetch branch details');
      }
    } catch (error) {
      message.error('Error fetching branch details');
    }
  };

  const fetchCategories = async (token) => {
    setLoading(true);
    try {
      const response = await fetch(`${BACKEND_URL}/api/categories/list-categories`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const data = await response.json();
      if (response.ok) setCategories(data);
      else message.error('Failed to fetch categories');
    } catch (error) {
      message.error('Error fetching categories');
    }
    setLoading(false);
  };

  const fetchEmployees = async (token, team, setter) => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/employees?team=${team}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const data = await response.json();
      if (response.ok) {
        const filteredEmployees = data.filter(employee => employee.status === 'Active');
        setter(filteredEmployees);
      } else {
        message.error(`Failed to fetch ${team}s`);
      }
    } catch (error) {
      message.error(`Error fetching ${team}s`);
    }
  };

  const fetchTodayAssignment = async (token) => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/daily-assignments/${branchId}/today`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const data = await response.json();
      if (response.ok) {
        setTodayAssignment(data);
        if (data.cashierId) setSelectedCashier(data.cashierId._id);
        if (data.managerId) setSelectedManager(data.managerId._id);
      } else {
        message.error('Failed to fetch today\'s assignment');
      }
    } catch (error) {
      message.error('Error fetching today\'s assignment');
    }
  };

  const fetchTableCategories = async (token) => {
    setTablesLoading(true);
    try {
      const response = await fetch(`${BACKEND_URL}/api/table-categories?branchId=${branchId}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const data = await response.json();
      if (response.ok) {
        setTableCategories(data.categories);
      } else {
        message.error('Failed to fetch table categories');
        setTableCategories([]);
      }
    } catch (error) {
      message.error('Error fetching table categories');
      setTableCategories([]);
    }
    setTablesLoading(false);
  };

  const createTableCategory = async () => {
    if (!newCategoryName || !newTableCount) {
      message.warning('Please provide a category name and table count');
      return;
    }

    if (newTableCount < 1) {
      message.warning('Table count must be at least 1');
      return;
    }

    try {
      const response = await fetch(`${BACKEND_URL}/api/table-categories`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: newCategoryName,
          branchId,
          tableCount: newTableCount,
        }),
      });

      const data = await response.json();
      if (response.ok) {
        message.success(data.message || 'Table category created successfully');
        fetchTableCategories(token);
        setNewCategoryName('');
        setNewTableCount(1);
      } else {
        message.error(data.message || 'Failed to create table category');
      }
    } catch (error) {
      message.error('Error creating table category');
    }
  };

  const updateTableCount = async (categoryId, newCount) => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/table-categories/${categoryId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          tableCount: newCount,
        }),
      });

      const data = await response.json();
      if (response.ok) {
        message.success(data.message || 'Table count updated successfully');
        fetchTableCategories(token);
      } else {
        message.error(data.message || 'Failed to update table count');
      }
    } catch (error) {
      message.error('Error updating table count');
    }
  };

  const saveAssignment = async () => {
    if (!selectedCashier && !selectedManager) {
      message.warning('Please select at least one cashier or manager');
      return;
    }
    try {
      const response = await fetch(`${BACKEND_URL}/api/daily-assignments/${branchId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          cashierId: selectedCashier,
          managerId: selectedManager,
        }),
      });
      const data = await response.json();
      if (response.ok) {
        message.success(data.message || 'Assignment saved successfully');
        setTodayAssignment(data.assignment);
      } else {
        message.error(data.message || 'Failed to save assignment');
      }
    } catch (error) {
      message.error('Error saving assignment');
    }
  };

  const handleWaiterInputChange = (value) => {
    setWaiterInput(value);
    setWaiterError('');
    setWaiterName('');
    setSelectedWaiter(null);

    if (!value) return;

    const numericValue = parseInt(value, 10);
    if (isNaN(numericValue) || numericValue < 0) {
      setWaiterError('Please enter a valid number');
      return;
    }

    const formattedId = `E${String(numericValue).padStart(3, '0')}`;
    const waiter = waiters.find(w => w.employeeId === formattedId);
    if (waiter) {
      setSelectedWaiter(waiter._id);
      setWaiterName(`${waiter.name} (${formattedId})`);
    } else {
      setWaiterError('Invalid Waiter ID');
    }
  };

  const userMenu = (
    <div style={{ padding: '10px', background: '#fff', borderRadius: '4px', width: '300px' }}>
      <div style={{ marginBottom: '15px' }}>
        <label style={{ display: 'block', marginBottom: '5px' }}>Select Cashier:</label>
        <Select
          value={selectedCashier}
          onChange={(value) => setSelectedCashier(value)}
          style={{ width: '100%' }}
          placeholder="Select a cashier"
          allowClear
        >
          {cashiers.length > 0 ? (
            cashiers.map(cashier => (
              <Option key={cashier._id} value={cashier._id}>
                {cashier.name}
              </Option>
            ))
          ) : (
            <Option disabled value={null}>No cashiers available</Option>
          )}
        </Select>
        {todayAssignment.cashierId && (
          <p style={{ marginTop: '5px', color: '#888' }}>
            Today's Cashier: {todayAssignment.cashierId.name}
          </p>
        )}
      </div>

      <div style={{ marginBottom: '15px' }}>
        <label style={{ display: 'block', marginBottom: '5px' }}>Select Manager:</label>
        <Select
          value={selectedManager}
          onChange={(value) => setSelectedManager(value)}
          style={{ width: '100%' }}
          placeholder="Select a manager"
          allowClear
        >
          {managers.length > 0 ? (
            managers.map(manager => (
              <Option key={manager._id} value={manager._id}>
                {manager.name}
              </Option>
            ))
          ) : (
            <Option disabled value={null}>No managers available</Option>
          )}
        </Select>
        {todayAssignment.managerId && (
          <p style={{ marginTop: '5px', color: '#888' }}>
            Today's Manager: {todayAssignment.managerId.name}
          </p>
        )}
      </div>

      <Button type="primary" onClick={saveAssignment} block style={{ marginBottom: '15px' }}>
        Confirm Assignment
      </Button>

      <Divider style={{ margin: '10px 0' }} />

      <div style={{ marginBottom: '15px' }}>
        <label style={{ display: 'block', marginBottom: '5px' }}>Create Table Category:</label>
        <AntInput
          placeholder="Category Name (e.g., Floor)"
          value={newCategoryName}
          onChange={(e) => setNewCategoryName(e.target.value)}
          style={{ marginBottom: '10px' }}
        />
        <InputNumber
          min={1}
          value={newTableCount}
          onChange={(value) => setNewTableCount(value)}
          placeholder="Number of Tables"
          style={{ width: '100%', marginBottom: '10px' }}
        />
        <Button type="primary" onClick={createTableCategory} block>
          Create Table Category
        </Button>
      </div>

      <Divider style={{ margin: '10px 0' }} />

      <div style={{ marginBottom: '15px' }}>
        <label style={{ display: 'block', marginBottom: '5px' }}>Manage Table Categories:</label>
        {tableCategories.length > 0 ? (
          tableCategories.map(category => (
            <div key={category._id} style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
              <span style={{ flex: 1 }}>{category.name} ({category.tableCount} tables)</span>
              <Button
                icon={<MinusOutlined />}
                onClick={() => updateTableCount(category._id, category.tableCount - 1)}
                style={{ marginRight: '5px' }}
                disabled={category.tableCount <= 1}
              />
              <Button
                icon={<PlusOutlined />}
                onClick={() => updateTableCount(category._id, category.tableCount + 1)}
              />
            </div>
          ))
        ) : (
          <p>No table categories found.</p>
        )}
      </div>
    </div>
  );

  const fetchProducts = async (categoryId) => {
    setProductsLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${BACKEND_URL}/api/products`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const data = await response.json();
      if (response.ok) {
        const filteredProducts = data.filter(product => product.category?._id === categoryId);
        setProducts(filteredProducts);
        setFilteredProducts(filteredProducts);
      } else {
        message.error('Failed to fetch products');
        setProducts([]);
        setFilteredProducts([]);
      }
    } catch (error) {
      message.error('Error fetching products');
      setProducts([]);
      setFilteredProducts([]);
    }
    setProductsLoading(false);
  };

  const handleProductTypeFilter = (type) => {
    setSelectedProductType(type);
    if (type === null) {
      setFilteredProducts([...products]);
    } else {
      const filtered = products.filter(product => product.productType === type);
      setFilteredProducts(filtered);
    }
  };

  const handleCategoryClick = (category) => {
    setSelectedCategory(category);
    setSelectedProductType(null);
    fetchProducts(category._id);
    setSelectedUnits({});
  };

  const handleTableClick = (table) => {
    const tableId = table._id;
    if (table.status === 'Occupied' && table.currentOrder) {
      message.warning('Table is already occupied. You can add more items or bill the existing order.');
      const existingOrder = table.currentOrder;
      setSelectedProductsByTab(prev => ({
        ...prev,
        tableOrder: {
          ...prev.tableOrder,
          [tableId]: existingOrder.products.map(product => ({
            ...product,
            _id: product.productId,
            count: product.quantity,
            selectedUnitIndex: 0,
            bminstock: product.bminstock || 0,
          })),
        },
      }));
      setSelectedWaiter(existingOrder.waiterId?._id || null);
      setWaiterInput(existingOrder.waiterId ? existingOrder.waiterId.employeeId?.replace('E', '') : '');
      setWaiterName(existingOrder.waiterId ? `${existingOrder.waiterId.name} (${existingOrder.waiterId.employeeId})` : '');
      setLastBillNo(existingOrder.billNo);
    } else {
      // Load existing unsaved cart for this table, or initialize as empty
      setSelectedProductsByTab(prev => ({
        ...prev,
        tableOrder: {
          ...prev.tableOrder,
          [tableId]: prev.tableOrder[tableId] || [],
        },
      }));
      setLastBillNo(null);
      setSelectedWaiter(null);
      setWaiterInput('');
      setWaiterName('');
      setWaiterError('');
    }
    setSelectedTable(table);
    setSelectedCategory(null);
    setProducts([]);
    setFilteredProducts([]);
    setSelectedProductType(null);
    setSelectedUnits({});
    message.info(`Selected table: ${table.tableNumber}`);
  };

  const handleUnitChange = (productId, unitIndex) => {
    setSelectedUnits(prev => ({
      ...prev,
      [productId]: unitIndex,
    }));
  };

  const stopPropagation = (e) => {
    e.stopPropagation();
  };

  const handleProductClick = (product) => {
    const selectedUnitIndex = selectedUnits[product._id] || 0;
    const tabKey = activeTab === 'tableOrder' && selectedTable ? selectedTable._id : activeTab;
    const tabSelections = activeTab === 'tableOrder' ? (selectedProductsByTab.tableOrder[tabKey] || []) : (selectedProductsByTab[activeTab] || []);
  
    // Apply stock restriction only for 'billing' and 'tableOrder' tabs
    if (activeTab === 'billing' || activeTab === 'tableOrder') {
      const stockInfo = branchInventory.find(item => item.productId._id === product._id);
      const availableStock = stockInfo ? stockInfo.inStock : 0;
      const currentCount = tabSelections
        .filter(item => item._id === product._id)
        .reduce((sum, item) => sum + item.count, 0);
  
      if (currentCount >= availableStock) {
        message.warning(`${product.name} is out of stock at this branch! (Stock: ${availableStock})`);
        return; // Block addition if stock limit reached
      }
    }
  
    // Proceed with adding to cart if no restriction or stock is available
    setSelectedProductsByTab(prev => {
      const existingProduct = tabSelections.find(item => item._id === product._id && item.selectedUnitIndex === selectedUnitIndex);
  
      if (existingProduct) {
        const updatedSelections = tabSelections.map(item =>
          item._id === product._id && item.selectedUnitIndex === selectedUnitIndex
            ? { ...item, count: item.count + 1 }
            : item
        );
        return activeTab === 'tableOrder'
          ? { ...prev, tableOrder: { ...prev.tableOrder, [tabKey]: updatedSelections } }
          : { ...prev, [activeTab]: updatedSelections };
      } else {
        const newSelections = [...tabSelections, { ...product, selectedUnitIndex, count: 1, bminstock: 0 }];
        return activeTab === 'tableOrder'
          ? { ...prev, tableOrder: { ...prev.tableOrder, [tabKey]: newSelections } }
          : { ...prev, [activeTab]: newSelections };
      }
    });
  };

  const handleIncreaseCount = (productId, selectedUnitIndex) => {
    setSelectedProductsByTab(prev => {
      const tabKey = activeTab === 'tableOrder' && selectedTable ? selectedTable._id : activeTab;
      const tabSelections = activeTab === 'tableOrder' ? (prev.tableOrder[tabKey] || []) : (prev[activeTab] || []);
      const updatedSelections = tabSelections.map(item =>
        item._id === productId && item.selectedUnitIndex === selectedUnitIndex
          ? { ...item, count: item.count + 1 }
          : item
      );
      return activeTab === 'tableOrder'
        ? { ...prev, tableOrder: { ...prev.tableOrder, [tabKey]: updatedSelections } }
        : { ...prev, [activeTab]: updatedSelections };
    });
  };

  const handleDecreaseCount = (productId, selectedUnitIndex) => {
    setSelectedProductsByTab(prev => {
      const tabKey = activeTab === 'tableOrder' && selectedTable ? selectedTable._id : activeTab;
      const tabSelections = activeTab === 'tableOrder' ? (prev.tableOrder[tabKey] || []) : (prev[activeTab] || []);
      const existingProduct = tabSelections.find(item => item._id === productId && item.selectedUnitIndex === selectedUnitIndex);

      if (existingProduct.count === 1) {
        const updatedSelections = tabSelections.filter(item => !(item._id === productId && item.selectedUnitIndex === selectedUnitIndex));
        return activeTab === 'tableOrder'
          ? { ...prev, tableOrder: { ...prev.tableOrder, [tabKey]: updatedSelections } }
          : { ...prev, [activeTab]: updatedSelections };
      } else {
        const updatedSelections = tabSelections.map(item =>
          item._id === productId && item.selectedUnitIndex === selectedUnitIndex
            ? { ...item, count: item.count - 1 }
            : item
        );
        return activeTab === 'tableOrder'
          ? { ...prev, tableOrder: { ...prev.tableOrder, [tabKey]: updatedSelections } }
          : { ...prev, [activeTab]: updatedSelections };
      }
    });
  };

  const handleRemoveProduct = (productId, selectedUnitIndex) => {
    setSelectedProductsByTab(prev => {
      const tabKey = activeTab === 'tableOrder' && selectedTable ? selectedTable._id : activeTab;
      const tabSelections = activeTab === 'tableOrder' ? (prev.tableOrder[tabKey] || []) : (prev[activeTab] || []);
      const updatedSelections = tabSelections.filter(item => !(item._id === productId && item.selectedUnitIndex === selectedUnitIndex));
      return activeTab === 'tableOrder'
        ? { ...prev, tableOrder: { ...prev.tableOrder, [tabKey]: updatedSelections } }
        : { ...prev, [activeTab]: updatedSelections };
    });
    setLastBillNo(null);
  };

  const handleBMInStockChange = (productId, selectedUnitIndex, value) => {
    setSelectedProductsByTab(prev => {
      const tabKey = activeTab === 'tableOrder' && selectedTable ? selectedTable._id : activeTab;
      const tabSelections = activeTab === 'tableOrder' ? (prev.tableOrder[tabKey] || []) : (prev[activeTab] || []);
      const updatedSelections = tabSelections.map(item =>
        item._id === productId && item.selectedUnitIndex === selectedUnitIndex
          ? { ...item, bminstock: value || 0 }
          : item
      );
      return activeTab === 'tableOrder'
        ? { ...prev, tableOrder: { ...prev.tableOrder, [tabKey]: updatedSelections } }
        : { ...prev, [activeTab]: updatedSelections };
    });
    setLastBillNo(null);
  };

  const handleBackToCategories = () => {
    setSelectedCategory(null);
    setProducts([]);
    setFilteredProducts([]);
    setSelectedProductType(null);
    setSelectedUnits({});
    setLastBillNo(null);
  };

  const handleBackToTables = () => {
    setSelectedTable(null);
    setSelectedCategory(null);
    setProducts([]);
    setFilteredProducts([]);
    setSelectedProductType(null);
    setSelectedUnits({});
    setLastBillNo(null);
    setSelectedWaiter(null);
    setWaiterInput('');
    setWaiterName('');
    setWaiterError('');
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setSelectedCategory(null);
    setSelectedTable(null);
    setProducts([]);
    setFilteredProducts([]);
    setSelectedProductType(null);
    setPaymentMethod(null); // You might want to keep this per-tab too
    setSelectedUnits({});   // Reset units only for current selection
    setLastBillNo(null);
    setSelectedWaiter(null);
    setWaiterInput('');
    setWaiterName('');
    setWaiterError('');
    setDeliveryDateTime(null);
    
    // Initialize cart for new tab if it doesn't exist, but don't reset existing ones
    setSelectedProductsByTab(prev => ({
        ...prev,
        [tab]: prev[tab] || (tab === 'tableOrder' ? {} : []),
    }));
    
    message.info(`Switched to ${tab}`);
    setIsMobileMenuOpen(false);
};

  const handleLogout = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
    }
    setToken(null);
    setName('Branch User');
    router.replace('/login');
  };

  const handleCartToggle = () => {
    setIsCartExpanded(!isCartExpanded);
    message.info(`Cart ${isCartExpanded ? 'collapsed' : 'expanded'}`);
    setTimeout(() => {
      if (contentRef.current) {
        setContentWidth(contentRef.current.getBoundingClientRect().width);
      }
    }, 0);
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const handleSave = async () => {
    const tabKey = activeTab === 'tableOrder' && selectedTable ? selectedTable._id : activeTab;
    const tabSelections = activeTab === 'tableOrder' ? (selectedProductsByTab.tableOrder[tabKey] || []) : (selectedProductsByTab[activeTab] || []);
    
    if (tabSelections.length === 0) {
        message.warning('Cart is empty!');
        return;
    }
    if (!paymentMethod) {
        message.warning('Please select a payment method!');
        return;
    }
    if (activeTab === 'tableOrder' && !selectedTable) {
        message.warning('Please select a table!');
        return;
    }

    const { totalQty, uniqueItems, subtotal, totalGST, totalWithGST } = calculateCartTotals();

    const orderData = {
        branchId,
        tab: activeTab,
        products: tabSelections.map(product => ({
            productId: product._id,
            name: product.name,
            quantity: product.count,
            price: product.priceDetails?.[product.selectedUnitIndex]?.price || 0,
            unit: product.priceDetails?.[product.selectedUnitIndex]?.unit || '',
            gstRate: product.priceDetails?.[product.selectedUnitIndex]?.gst || 0,
            productTotal: calculateProductTotal(product),
            productGST: calculateProductGST(product),
            bminstock: product.bminstock || 0,
        })),
        paymentMethod,
        subtotal,
        totalGST,
        totalWithGST,
        totalItems: uniqueItems,
        status: 'draft',
        waiterId: selectedWaiter,
        ...(activeTab === 'stock' && { 
            deliveryDateTime: deliveryDateTime ? deliveryDateTime.toISOString() : defaultDeliveryDateTime.toISOString() 
        }),
        ...(activeTab === 'tableOrder' && { tableId: selectedTable?._id }),
    };

    try {
        const response = await fetch(`${BACKEND_URL}/api/orders`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify(orderData),
        });

        const data = await response.json();
        if (response.ok) {
            message.success(data.message || 'Cart saved as draft!');
            setLastBillNo(data.order.billNo);
            // Only clear the current tab's cart, preserve others
            setSelectedProductsByTab(prev => ({
                ...prev,
                ...(activeTab === 'tableOrder' 
                    ? { tableOrder: { ...prev.tableOrder, [tabKey]: [] } }
                    : { [activeTab]: [] })
            }));
            setSelectedWaiter(null);
            setWaiterInput('');
            setWaiterName('');
            setWaiterError('');
            setDeliveryDateTime(null);
            if (activeTab === 'tableOrder') {
                fetchTableCategories(token);
                setSelectedTable(null);
            }
        } else {
            message.error(data.message || 'Failed to save order');
        }
    } catch (error) {
        message.error('Error saving order');
    }
};

const handleSaveAndPrint = async () => {
  const tabKey = activeTab === 'tableOrder' && selectedTable ? selectedTable._id : activeTab;
  const tabSelections = activeTab === 'tableOrder' ? (selectedProductsByTab.tableOrder[tabKey] || []) : (selectedProductsByTab[activeTab] || []);
  
  if (tabSelections.length === 0) {
      message.warning('Cart is empty!');
      return;
  }
  if (!paymentMethod) {
      message.warning('Please select a payment method!');
      return;
  }
  if (activeTab === 'tableOrder' && !selectedTable) {
      message.warning('Please select a table!');
      return;
  }

  const { totalQty, uniqueItems, subtotal, totalGST, totalWithGST } = calculateCartTotals();

  const totalWithGSTRounded = Math.round(totalWithGST);
  const roundOff = totalWithGSTRounded - totalWithGST;
  const tenderAmount = totalWithGSTRounded;
  const balance = tenderAmount - totalWithGSTRounded;
  const sgst = totalGST / 2;
  const cgst = totalGST / 2;

  // Set status based on tab: "completed" for billing, order, cake, tableOrder; "neworder" for stock, liveOrder
  const orderStatus = ['billing', 'order', 'cake', 'tableOrder'].includes(activeTab) ? 'completed' : 'neworder';

  const orderData = {
      branchId,
      tab: activeTab,
      products: tabSelections.map(product => ({
          productId: product._id,
          name: product.name,
          quantity: product.count,
          price: product.priceDetails?.[product.selectedUnitIndex]?.price || 0,
          unit: product.priceDetails?.[product.selectedUnitIndex]?.unit || '',
          gstRate: product.priceDetails?.[product.selectedUnitIndex]?.gst || 0,
          productTotal: calculateProductTotal(product),
          productGST: calculateProductGST(product),
          bminstock: product.bminstock || 0,
      })),
      paymentMethod,
      subtotal,
      totalGST,
      totalWithGST,
      totalItems: uniqueItems,
      status: orderStatus,
      waiterId: selectedWaiter,
      ...(activeTab === 'stock' && { 
          deliveryDateTime: deliveryDateTime ? deliveryDateTime.toISOString() : defaultDeliveryDateTime.toISOString() 
      }),
      ...(activeTab === 'tableOrder' && { tableId: selectedTable?._id }),
  };

  try {
      const response = await fetch(`${BACKEND_URL}/api/orders`, {
          method: 'POST',
          headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify(orderData),
      });

      const data = await response.json();
      if (response.ok) {
          message.success(data.message || 'Cart saved and ready to print!');
          setLastBillNo(data.order.billNo);

          // Reduce branch stock only for billing, order, cake, tableOrder tabs
          if (['billing', 'order', 'cake', 'tableOrder'].includes(activeTab)) {
              await reduceBranchStock(data.order);
          }

          printReceipt(data.order, todayAssignment, {
              totalQty,
              totalItems: uniqueItems,
              subtotal,
              sgst,
              cgst,
              totalWithGST,
              totalWithGSTRounded,
              roundOff,
              paymentMethod,
              tenderAmount,
              balance,
          });

          // Clear the current tab's cart
          setSelectedProductsByTab(prev => ({
              ...prev,
              ...(activeTab === 'tableOrder' 
                  ? { tableOrder: { ...prev.tableOrder, [tabKey]: [] } }
                  : { [activeTab]: [] })
          }));
          setSelectedWaiter(null);
          setWaiterInput('');
          setWaiterName('');
          setWaiterError('');
          setDeliveryDateTime(null);
          if (activeTab === 'tableOrder') {
              fetchTableCategories(token);
              setSelectedTable(null);
          }
      } else {
          message.error(data.message || 'Failed to save and print order');
      }
  } catch (error) {
      message.error('Error saving and printing order');
  }
};

// New function to reduce branch stock
const reduceBranchStock = async (order) => {
  try {
      const response = await fetch(`${BACKEND_URL}/api/inventory/reduce`, {
          method: 'PUT',
          headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({
              branchId: order.branchId,
              products: order.products.map(product => ({
                  productId: product.productId,
                  quantity: product.quantity,
              })),
          }),
      });

      const data = await response.json();
      if (response.ok) {
          message.success('Stock updated successfully');
      } else {
          message.error(data.message || 'Failed to reduce stock');
      }
  } catch (error) {
      message.error('Error reducing stock');
  }
};

const printReceipt = (order, todayAssignment, summary) => {
  const { totalQty, totalItems, subtotal, sgst, cgst, totalWithGST, totalWithGSTRounded, roundOff, paymentMethod, tenderAmount, balance } = summary;
  const printWindow = window.open('', '_blank');
  const dateTime = new Date().toLocaleString('en-IN', { 
    day: '2-digit', 
    month: '2-digit', 
    year: 'numeric', 
    hour: '2-digit', 
    minute: '2-digit', 
    hour12: true 
  }).replace(',', '');

  printWindow.document.write(`
    <html>
      <head>
        <title>Receipt</title>
        <style>
          body {
            font-family: 'Courier New', Courier, monospace;
            width: 302px;
            margin: 0;
            padding: 5px;
            font-size: 10px;
            line-height: 1.2;
          }
          h2 {
            text-align: center;
            font-size: 14px;
            font-weight: bold;
            margin: 0 0 5px 0;
          }
          .header {
            display: flex;
            justify-content: space-between;
            margin-bottom: 5px;
            width: 100%;
          }
          .header-left {
            text-align: left;
            max-width: 50%;
            overflow: hidden;
            text-overflow: ellipsis;
          }
          .header-right {
            text-align: right;
            max-width: 50%;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }
          p {
            margin: 2px 0;
            overflow: hidden;
            text-overflow: ellipsis;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 5px;
          }
          th, td {
            padding: 2px;
            text-align: left;
            font-size: 10px;
          }
          th {
            font-weight: bold;
          }
          .divider {
            border-top: 1px dashed #000;
            margin: 5px 0;
          }
          .summary {
            margin-top: 5px;
          }
          .summary div {
            display: flex;
            justify-content: space-between;
          }
          .payment-details {
            margin-top: 5px;
          }
          @media print {
            @page {
              margin: 0;
              size: 80mm auto;
            }
            body {
              margin: 0;
              padding: 5px;
            }
          }
        </style>
      </head>
      <body>
        <h2>${order.branchId?.name || 'Unknown Branch'}</h2>
        <p style="text-align: center;">${order.branchId?.address || 'Address Not Available'}</p>
        <p style="text-align: center;">Phone: ${order.branchId?.phoneNo || 'Phone Not Available'}</p>
        <p style="text-align: center;">Bill No: ${order.billNo}</p>
        ${order.tableId ? `<p style="text-align: center;">Table: ${order.tableId.tableNumber}</p>` : ''}
        <div class="header">
          <div class="header-left">
            <p>Date: ${dateTime}</p>
            <p>Manager: ${todayAssignment?.managerId?.name || 'Not Assigned'}, Waiter: ${order.waiterId?.name || 'Not Assigned'}</p>
          </div>
          <div class="header-right">
            <p>Cashier: ${todayAssignment?.cashierId?.name || 'Not Assigned'}</p>
          </div>
        </div>
        <div class="divider"></div>
        <table>
          <thead>
            <tr>
              <th style="width: 10%;">SL</th>
              <th style="width: 40%;">Description</th>
              <th style="width: 15%;">MRP</th>
              <th style="width: 15%;">Qty</th>
              <th style="width: 20%;">Amount</th>
            </tr>
          </thead>
          <tbody>
            ${order.products.map((product, index) => `
              <tr>
                <td>${index + 1}</td>
                <td style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                  ${product.name} (${product.quantity}${product.unit}${product.cakeType ? `, ${product.cakeType === 'freshCream' ? 'FC' : 'BC'}` : ''})
                </td>
                <td>₹${product.price.toFixed(2)}</td>
                <td>${product.quantity}</td>
                <td>₹${product.productTotal.toFixed(2)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        <div class="divider"></div>
        <div class="summary">
          <div><span>Tot Qty:</span><span>${totalQty.toFixed(2)}</span></div>
          <div><span>Tot Items:</span><span>${totalItems}</span></div>
          <div><span>Total Amount:</span><span>₹${subtotal.toFixed(2)}</span></div>
          <div><span>SGST:</span><span>₹${sgst.toFixed(2)}</span></div>
          <div><span>CGST:</span><span>₹${cgst.toFixed(2)}</span></div>
          <div><span>Round Off:</span><span>${roundOff >= 0 ? '+' : ''}${roundOff.toFixed(2)}</span></div>
          <div><span>Net Amt:</span><span>₹${totalWithGSTRounded.toFixed(2)}</span></div>
        </div>
        <div class="payment-details">
          <p>Payment Details:</p>
          <p>${paymentMethod.charAt(0).toUpperCase() + paymentMethod.slice(1)} - ₹${totalWithGSTRounded.toFixed(2)}</p>
          <p>Tender: ₹${tenderAmount.toFixed(2)}</p>
          <p>Balance: ₹${balance.toFixed(2)}</p>
        </div>
        ${order.deliveryDateTime ? `<p>Delivery: ${dayjs(order.deliveryDateTime).tz('Asia/Kolkata').format('DD/MM/YYYY HH:mm')}</p>` : ''}
      </body>
    </html>
  `);
  printWindow.document.close();
  printWindow.print();
  printWindow.close();
};

  const getCardSize = () => {
    if (typeof window === 'undefined') return 200;
    if (window.innerWidth >= 1600) return 200;
    if (window.innerWidth >= 1400) return 180;
    if (window.innerWidth >= 1200) return 160;
    if (window.innerWidth >= 992) return 150;
    if (window.innerWidth >= 768) return isPortrait ? 140 : 150;
    if (window.innerWidth >= 576) return isPortrait ? 120 : 130;
    return isPortrait ? 100 : 110;
  };

  const cardSize = getCardSize();
  const gutter = 16;
  const columns = contentWidth > 0 ? Math.floor(contentWidth / (cardSize + gutter)) : 1;
  const fontSize = isPortrait && window.innerWidth <= 575 ? 10 : Math.max(cardSize * 0.1, 12);
  const lineHeight = Math.max(cardSize * 0.3, 20);

  const formatPriceDetails = (priceDetails, selectedUnitIndex = 0) => {
    if (!priceDetails || priceDetails.length === 0 || typeof selectedUnitIndex !== 'number') return 'No Price';
    const detail = priceDetails[selectedUnitIndex];
    return `₹${detail.price}`;
  };

  const formatUnitLabel = (detail, productType) => {
    const baseLabel = `${detail.quantity}${detail.unit}`;
    if (productType === 'cake' && detail.cakeType) {
      const cakeTypeLabel = detail.cakeType === 'freshCream' ? 'FC' : 'BC';
      return `${baseLabel} (${cakeTypeLabel})`;
    }
    return baseLabel;
  };

  const formatTooltip = (detail, productType) => {
    const baseTooltip = `Unit: ${detail.quantity}${detail.unit}, GST: ${detail.gst}%`;
    if (productType === 'cake' && detail.cakeType) {
      const cakeTypeLabel = detail.cakeType === 'freshCream' ? 'FC' : 'BC';
      return `${baseTooltip}, Type: ${cakeTypeLabel}`;
    }
    return baseTooltip;
  };

  const formatDisplayName = (product) => {
    const detail = product.priceDetails?.[product.selectedUnitIndex];
    if (!detail) return product.name;
    const baseName = `${product.name} (${detail.quantity}${detail.unit}${product.productType === 'cake' && detail.cakeType ? `, ${detail.cakeType === 'freshCream' ? 'FC' : 'BC'}` : ''})`;
    return baseName;
  };

  const calculateProductTotal = (product) => {
    if (!product.priceDetails || product.priceDetails.length === 0) return 0;
    const selectedUnitIndex = product.selectedUnitIndex || 0;
    const price = product.priceDetails[selectedUnitIndex]?.price || 0;
    return price * product.count;
  };

  const calculateProductGST = (product) => {
    const productTotal = calculateProductTotal(product);
    const selectedUnitIndex = product.selectedUnitIndex || 0;
    const gstRate = product.priceDetails?.[selectedUnitIndex]?.gst || 0;
    return productTotal * (gstRate / 100);
  };

  const calculateCartTotals = () => {
    const tabKey = activeTab === 'tableOrder' && selectedTable ? selectedTable._id : activeTab;
    const tabSelections = activeTab === 'tableOrder' ? (selectedProductsByTab.tableOrder[tabKey] || []) : (selectedProductsByTab[activeTab] || []);
    const totalQty = tabSelections.reduce((sum, product) => sum + product.count, 0);
    const uniqueItems = tabSelections.length;
    const subtotal = tabSelections.reduce((sum, product) => sum + calculateProductTotal(product), 0);
    const totalGST = tabSelections.reduce((sum, product) => sum + calculateProductGST(product), 0);
    const totalWithGST = subtotal + totalGST;
    return { totalQty, uniqueItems, subtotal, totalGST, totalWithGST };
  };

  const currentTabSelections = activeTab === 'tableOrder' && selectedTable 
    ? (selectedProductsByTab.tableOrder[selectedTable._id] || []) 
    : (selectedProductsByTab[activeTab] || []);
  const { totalQty, uniqueItems, subtotal, totalGST, totalWithGST } = calculateCartTotals();

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header
        style={{
          background: "#000000",
          padding: "0 20px",
          color: "#FFFFFF",
          height: "auto",
          boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
          }}
        >
          <div style={{ fontSize: "18px", fontWeight: "bold", fontFamily: "Arial, sans-serif" }}>
            {name} | {branchName || 'Branch Loading...'}
          </div>

          <Button
            type="text"
            icon={<MenuOutlined />}
            onClick={toggleMobileMenu}
            style={{
              display: isPortrait || isMobile ? "block" : "none",
              fontSize: "18px",
              color: "#FFFFFF",
            }}
          />

          <div
            style={{
              display: isPortrait || isMobile ? (isMobileMenuOpen ? "flex" : "none") : "flex",
              flexDirection: isPortrait || isMobile ? "column" : "row",
              alignItems: "center",
              width: isPortrait || isMobile ? "100%" : "auto",
              padding: isPortrait || isMobile ? "10px 0" : "0",
              background: isPortrait || isMobile ? "#000000" : "transparent",
              position: isPortrait || isMobile ? "absolute" : "static",
              top: isPortrait || isMobile ? "50px" : "auto",
              left: isPortrait || isMobile ? "0" : "auto",
              zIndex: 1000,
            }}
          >
            <Space wrap align="center" style={{ margin: isPortrait || isMobile ? '0' : '0 20px' }}>
              {['stock', 'billing', 'order', 'liveOrder', 'cake', 'tableOrder'].map(tab => (
                <Button
                  key={tab}
                  type="text"
                  onClick={() => handleTabChange(tab)}
                  style={{
                    background: activeTab === tab ? '#95BF47' : '#000000',
                    borderColor: activeTab === tab ? '#95BF47' : '#FFFFFF',
                    color: "#FFFFFF",
                    fontSize: "14px",
                    margin: isPortrait || isMobile ? "5px 0" : "0 5px",
                    padding: "0 10px",
                  }}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1).replace(/([A-Z])/g, ' $1')}
                    {tab === 'tableOrder' 
                        ? Object.values(selectedProductsByTab.tableOrder).some(items => items.length > 0) && <Badge count="*" />
                        : selectedProductsByTab[tab]?.length > 0 && <Badge count={selectedProductsByTab[tab].length} />}
                </Button>
              ))}
            </Space>
          </div>

          <div
            style={{
              display: isPortrait || isMobile ? "none" : "flex",
              alignItems: "center",
            }}
          >
            <Space align="center">
              <Button
                type="text"
                icon={<ShoppingCartOutlined />}
                onClick={handleCartToggle}
                style={{
                  fontSize: "16px",
                  color: "#FFFFFF",
                  marginRight: '10px',
                }}
              />
              <Dropdown overlay={userMenu} trigger={['click']}>
                <Button
                  type="text"
                  icon={<UserOutlined />}
                  style={{
                    fontSize: "16px",
                    color: "#FFFFFF",
                    marginRight: '10px',
                  }}
                />
              </Dropdown>
              <span style={{ fontSize: "14px", color: "#FFFFFF" }}>
                {name} |
              </span>
              <Button
                type="text"
                icon={<LogoutOutlined />}
                onClick={handleLogout}
                style={{
                  fontSize: "16px",
                  color: "#FFFFFF",
                }}
              >
                Logout
              </Button>
            </Space>
          </div>
        </div>
      </Header>

      <Layout style={{ flex: 1 }}>
        <Content
          ref={contentRef}
          style={{
            padding: '20px',
            background: '#FFFFFF',
            flex: isCartExpanded ? '80%' : '100%',
            minHeight: 'calc(100vh - 50px)',
          }}
        >
          <div style={{ marginBottom: '20px' }}>
            {activeTab === 'tableOrder' ? (
              <>
                {selectedTable ? (
                  <>
                    {selectedCategory ? (
                      <>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '15px' }}>
                          <div style={{ display: 'flex', alignItems: 'center' }}>
                            <Button
                              type="text"
                              icon={<ArrowLeftOutlined />}
                              onClick={handleBackToCategories}
                              style={{ marginRight: '10px', color: '#000000' }}
                            >
                              Back to Categories
                            </Button>
                            <h2 style={{ color: '#000000', margin: 0 }}>
                              Table Order - {selectedTable.tableNumber} - {selectedCategory.name}
                            </h2>
                          </div>
                          <Space>
                            <Button
                              type={selectedProductType === null ? "primary" : "default"}
                              onClick={() => handleProductTypeFilter(null)}
                            >
                              All
                            </Button>
                            <Button
                              type={selectedProductType === 'cake' ? "primary" : "default"}
                              onClick={() => handleProductTypeFilter('cake')}
                            >
                              Cake
                            </Button>
                            <Button
                              type={selectedProductType === 'non-cake' ? "primary" : "default"}
                              onClick={() => handleProductTypeFilter('non-cake')}
                            >
                              Non-Cake
                            </Button>
                          </Space>
                        </div>
                        {productsLoading ? (
                          <div>Loading products...</div>
                        ) : filteredProducts.length > 0 ? (
                          <Row gutter={[16, 24]} justify="center">
                           {filteredProducts.map(product => {
                                const selectedUnitIndex = selectedUnits[product._id] || 0;
                                const selectedProduct = currentTabSelections.find(item => item._id === product._id && item.selectedUnitIndex === selectedUnitIndex);
                                const count = selectedProduct ? selectedProduct.count : 0;
                                const stockInfo = branchInventory.find(item => item.productId._id === product._id);
                                const availableStock = stockInfo ? stockInfo.inStock : 0;

                                // Calculate total count in cart for this product across all units (for Billing and Table tabs)
                                const tabKey = activeTab === 'tableOrder' && selectedTable ? selectedTable._id : activeTab;
                                const tabSelections = activeTab === 'tableOrder' ? (selectedProductsByTab.tableOrder[tabKey] || []) : (selectedProductsByTab[activeTab] || []);
                                const currentCount = tabSelections
                                  .filter(item => item._id === product._id)
                                  .reduce((sum, item) => sum + item.count, 0);

                                // Define "Out of Stock" conditions based on tab:
                                let isOutOfStock = false;
                                if (activeTab === 'billing' || activeTab === 'tableOrder') {
                                  // Real-time for Billing and Table Order: Show when cart count >= stock
                                  isOutOfStock = currentCount >= availableStock;
                                } else if (activeTab === 'stock' || activeTab === 'liveOrder') {
                                  // For Stock and Live Order: Show when inStock === 0 (purchasing view)
                                  isOutOfStock = !stockInfo || stockInfo.inStock === 0;
                                }
                                // No label for 'cake' tab

                                return (
                                  <Col
                                    key={product._id}
                                    span={24 / columns}
                                    style={{ display: 'flex', justifyContent: 'center' }}
                                  >
                                    <div
                                      style={{
                                        position: 'relative',
                                      }}
                                    >
                                      <div
                                        style={{
                                          width: cardSize,
                                          height: cardSize,
                                          borderRadius: 8,
                                          overflow: 'hidden',
                                          position: 'relative',
                                          boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
                                          cursor: 'pointer',
                                          border: count > 0 ? '3px solid #95BF47' : 'none',
                                        }}
                                        onClick={() => handleProductClick(product)}
                                      >
                                        <div
                                          style={{
                                            position: 'absolute',
                                            top: 5,
                                            right: 5,
                                            width: '12px',
                                            height: '12px',
                                            borderRadius: '50%',
                                            backgroundColor: product.isVeg ? 'green' : 'red',
                                            zIndex: 1,
                                          }}
                                        />
                                        {product.images?.length > 0 ? (
                                          <div style={{ position: 'relative', width: '100%', height: '100%' }}>
                                            <Image
                                              src={`${BACKEND_URL}/uploads/${product.images[0]}`}
                                              alt={product.name}
                                              style={{
                                                width: '100%',
                                                height: '100%',
                                                objectFit: 'cover',
                                                padding: 0,
                                                margin: 0,
                                              }}
                                              preview={false}
                                            />
                                          </div>
                                        ) : (
                                          <div style={{ width: '100%', height: '100%', background: '#E9E9E9', display: 'flex', justifyContent: 'center', alignItems: 'center', padding: 0, margin: 0, position: 'relative' }}>
                                            No Image
                                          </div>
                                        )}
                                        <div
                                          style={{
                                            position: 'absolute',
                                            top: 5,
                                            left: 5,
                                            background: 'rgba(0, 0, 0, 0.6)',
                                            color: '#FFFFFF',
                                            fontSize: `${fontSize * 0.7}px`, // Changed from ${fontSize}px to match stock status
                                            fontWeight: 'bold',
                                            padding: '2px 5px',
                                            borderRadius: 4,
                                            maxWidth: '80%',
                                            whiteSpace: 'nowrap',
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                            display: 'flex',
                                            alignItems: 'center',
                                          }}
                                        >
                                          {product.name}
                                          <span
                                            style={{
                                              marginLeft: 5,
                                              color: isOutOfStock ? 'red' : 'rgb(150, 191, 71)', // Red for "OS", rgb(150, 191, 71) for "-<count>"
                                              fontSize: `${fontSize * 0.7}px`, // Already set, kept for consistency
                                              fontWeight: 'bold',
                                            }}
                                          >
                                            {isOutOfStock ? 'OS' : `-${availableStock}`}
                                          </span>
                                        </div>
                                        <div
                                          style={{
                                            position: 'absolute',
                                            bottom: 5,
                                            left: 5,
                                            right: 5,
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                          }}
                                        >
                                          <div
                                            style={{
                                              background: 'rgba(0, 0, 0, 0.6)',
                                              color: '#FFFFFF',
                                              fontSize: `${fontSize * 0.9}px`,
                                              fontWeight: 'bold',
                                              padding: '2px 5px',
                                              borderRadius: 4,
                                              cursor: 'pointer',
                                            }}
                                          >
                                            <Tooltip
                                              title={
                                                product.priceDetails?.[selectedUnitIndex]
                                                  ? formatTooltip(product.priceDetails[selectedUnitIndex], product.productType)
                                                  : 'No Details'
                                              }
                                            >
                                              {formatPriceDetails(product.priceDetails, selectedUnitIndex)}
                                            </Tooltip>
                                          </div>
                                          <div
                                            style={{
                                              width: '40%',
                                            }}
                                            onClick={stopPropagation}
                                          >
                                            <Select
                                              value={selectedUnitIndex}
                                              onChange={(value) => handleUnitChange(product._id, value)}
                                              size="small"
                                              style={{ width: '100%' }}
                                            >
                                              {product.priceDetails?.map((detail, index) => (
                                                <Option key={index} value={index}>
                                                  {formatUnitLabel(detail, product.productType)}
                                                </Option>
                                              ))}
                                            </Select>
                                          </div>
                                          {count > 0 && (
                                            <div
                                              style={{
                                                background: 'rgba(0, 0, 0, 0.6)',
                                                color: '#FFFFFF',
                                                fontSize: `${fontSize * 0.9}px`,
                                                fontWeight: 'bold',
                                                padding: '2px 5px',
                                                borderRadius: 4,
                                              }}
                                            >
                                              {count}
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                      {count > 0 && (
                                        <CheckCircleFilled
                                          style={{
                                            position: 'absolute',
                                            top: -12,
                                            right: -12,
                                            fontSize: '24px',
                                            color: '#95BF47',
                                          }}
                                        />
                                      )}
                                    </div>
                                  </Col>
                                );
                              })}
                          </Row>
                        ) : (
                          <div>No products found for this category.</div>
                        )}
                      </>
                    ) : (
                      <>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '15px' }}>
                          <div style={{ display: 'flex', alignItems: 'center' }}>
                            <Button
                              type="text"
                              icon={<ArrowLeftOutlined />}
                              onClick={handleBackToTables}
                              style={{ marginRight: '10px', color: '#000000' }}
                            >
                              Back to Tables
                            </Button>
                            <h2 style={{ color: '#000000', margin: 0 }}>
                              Table Order - {selectedTable.tableNumber}
                            </h2>
                          </div>
                        </div>
                        <Row gutter={[16, 24]} justify="center">
                          {loading ? (
                            <div>Loading categories...</div>
                          ) : categories.length > 0 ? (
                            categories.map(category => (
                              <Col
                                key={category._id}
                                span={24 / columns}
                                style={{ display: 'flex', justifyContent: 'center' }}
                              >
                                <div
                                  style={{
                                    width: cardSize,
                                    height: cardSize,
                                    borderRadius: 8,
                                    overflow: 'hidden',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
                                    cursor: 'pointer',
                                  }}
                                  onClick={() => handleCategoryClick(category)}
                                >
                                  <div style={{ width: '100%', height: '100%', overflow: 'hidden', padding: 0, margin: 0 }}>
                                    {category.image ? (
                                      <Image
                                        src={`${BACKEND_URL}/${category.image}`}
                                        alt={category.name}
                                        style={{ width: '100%', height: '100%', objectFit: 'cover', padding: 0, margin: 0 }}
                                        preview={false}
                                      />
                                    ) : (
                                      <div style={{ width: '100%', height: '100%', background: '#E9E9E9', display: 'flex', justifyContent: 'center', alignItems: 'center', padding: 0, margin: 0 }}>No Image</div>
                                    )}
                                  </div>
                                  <div style={{ width: '100%', background: '#000000', textAlign: 'center', padding: 0, margin: 0 }}>
                                    <span
                                      style={{
                                        color: '#FFFFFF',
                                        fontSize: `${fontSize}px`,
                                        fontWeight: 'bold',
                                        padding: 0,
                                        margin: 0,
                                        display: 'block',
                                        lineHeight: `${lineHeight}px`,
                                        whiteSpace: 'nowrap',
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                      }}
                                    >
                                      {category.name}
                                    </span>
                                  </div>
                                </div>
                              </Col>
                            ))
                          ) : (
                            <div>No categories found</div>
                          )}
                        </Row>
                      </>
                    )}
                  </>
                ) : (
                  <>
                    <h2 style={{ color: '#000000', marginBottom: '15px' }}>Table Order</h2>
                    {tablesLoading ? (
                      <div>Loading tables...</div>
                    ) : tableCategories.length > 0 ? (
                      tableCategories.map(category => (
                        <div key={category._id} style={{ marginBottom: '30px' }}>
                          <h3 style={{ color: '#000000', marginBottom: '15px' }}>{category.name}</h3>
                          <Row gutter={[16, 24]} justify="center">
                            {category.tables.map(table => (
                              <Col
                                key={table._id}
                                span={24 / columns}
                                style={{ display: 'flex', justifyContent: 'center' }}
                              >
                                <div
                                  style={{
                                    width: cardSize,
                                    height: cardSize,
                                    borderRadius: 8,
                                    overflow: 'hidden',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                    boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
                                    cursor: 'pointer',
                                    border: table.status === 'Occupied' ? '3px solid #ff4d4f' : '3px solid #52c41a',
                                  }}
                                  onClick={() => handleTableClick(table)}
                                >
                                  <span
                                    style={{
                                      color: table.status === 'Occupied' ? '#ff4d4f' : '#52c41a',
                                      fontSize: `${fontSize}px`,
                                      fontWeight: 'bold',
                                    }}
                                  >
                                    {table.tableNumber}
                                  </span>
                                  <span
                                    style={{
                                      color: table.status === 'Occupied' ? '#ff4d4f' : '#52c41a',
                                      fontSize: `${fontSize * 0.8}px`,
                                    }}
                                  >
                                    {table.status}
                                  </span>
                                </div>
                              </Col>
                            ))}
                          </Row>
                        </div>
                      ))
                    ) : (
                      <div>No tables found. Create table categories in the user menu.</div>
                    )}
                  </>
                )}
              </>
            ) : (
              <>
                {selectedCategory ? (
                  <>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '15px' }}>
                      <div style={{ display: 'flex', alignItems: 'center' }}>
                        <Button
                          type="text"
                          icon={<ArrowLeftOutlined />}
                          onClick={handleBackToCategories}
                          style={{ marginRight: '10px', color: '#000000' }}
                        >
                          Back to Categories
                        </Button>
                        <h2 style={{ color: '#000000', margin: 0 }}>{activeTab.charAt(0).toUpperCase() + activeTab.slice(1).replace(/([A-Z])/g, ' $1')} - {selectedCategory.name}</h2>
                      </div>
                      <Space>
                        <Button
                          type={selectedProductType === null ? "primary" : "default"}
                          onClick={() => handleProductTypeFilter(null)}
                        >
                          All
                        </Button>
                        <Button
                          type={selectedProductType === 'cake' ? "primary" : "default"}
                          onClick={() => handleProductTypeFilter('cake')}
                        >
                          Cake
                        </Button>
                        <Button
                          type={selectedProductType === 'non-cake' ? "primary" : "default"}
                          onClick={() => handleProductTypeFilter('non-cake')}
                        >
                          Non-Cake
                        </Button>
                      </Space>
                    </div>
                    {productsLoading ? (
                      <div>Loading products...</div>
                    ) : filteredProducts.length > 0 ? (
                      <Row gutter={[16, 24]} justify="center">
                       {filteredProducts.map(product => {
                          const selectedUnitIndex = selectedUnits[product._id] || 0;
                          const selectedProduct = currentTabSelections.find(item => item._id === product._id && item.selectedUnitIndex === selectedUnitIndex);
                          const count = selectedProduct ? selectedProduct.count : 0;
                          const stockInfo = branchInventory.find(item => item.productId._id === product._id);
                          const availableStock = stockInfo ? stockInfo.inStock : 0;

                          // Calculate total count in cart for this product across all units (for Billing and Table tabs)
                          const tabKey = activeTab === 'tableOrder' && selectedTable ? selectedTable._id : activeTab;
                          const tabSelections = activeTab === 'tableOrder' ? (selectedProductsByTab.tableOrder[tabKey] || []) : (selectedProductsByTab[activeTab] || []);
                          const currentCount = tabSelections
                            .filter(item => item._id === product._id)
                            .reduce((sum, item) => sum + item.count, 0);

                          // Define "Out of Stock" conditions based on tab:
                          let isOutOfStock = false;
                          if (activeTab === 'billing' || activeTab === 'tableOrder') {
                            // Real-time for Billing and Table Order: Show when cart count >= stock
                            isOutOfStock = currentCount >= availableStock;
                          } else if (activeTab === 'stock' || activeTab === 'liveOrder') {
                            // For Stock and Live Order: Show when inStock === 0 (purchasing view)
                            isOutOfStock = !stockInfo || stockInfo.inStock === 0;
                          }
                          // No label for 'cake' tab

                          return (
                            <Col
                              key={product._id}
                              span={24 / columns}
                              style={{ display: 'flex', justifyContent: 'center' }}
                            >
                              <div
                                style={{
                                  position: 'relative',
                                }}
                              >
                                <div
                                  style={{
                                    width: cardSize,
                                    height: cardSize,
                                    borderRadius: 8,
                                    overflow: 'hidden',
                                    position: 'relative',
                                    boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
                                    cursor: 'pointer',
                                    border: count > 0 ? '3px solid #95BF47' : 'none',
                                  }}
                                  onClick={() => handleProductClick(product)}
                                >
                                  <div
                                    style={{
                                      position: 'absolute',
                                      top: 5,
                                      right: 5,
                                      width: '12px',
                                      height: '12px',
                                      borderRadius: '50%',
                                      backgroundColor: product.isVeg ? 'green' : 'red',
                                      zIndex: 1,
                                    }}
                                  />
                                  {product.images?.length > 0 ? (
                                    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
                                      <Image
                                        src={`${BACKEND_URL}/uploads/${product.images[0]}`}
                                        alt={product.name}
                                        style={{
                                          width: '100%',
                                          height: '100%',
                                          objectFit: 'cover',
                                          padding: 0,
                                          margin: 0,
                                        }}
                                        preview={false}
                                      />
                                    </div>
                                  ) : (
                                    <div style={{ width: '100%', height: '100%', background: '#E9E9E9', display: 'flex', justifyContent: 'center', alignItems: 'center', padding: 0, margin: 0, position: 'relative' }}>
                                      No Image
                                    </div>
                                  )}
                                  <div
                                    style={{
                                      position: 'absolute',
                                      top: 5,
                                      left: 5,
                                      background: 'rgba(0, 0, 0, 0.6)',
                                      color: '#FFFFFF',
                                      fontSize: `${fontSize * 0.7}px`, // Changed from ${fontSize}px to match stock status
                                      fontWeight: 'bold',
                                      padding: '2px 5px',
                                      borderRadius: 4,
                                      maxWidth: '80%',
                                      whiteSpace: 'nowrap',
                                      overflow: 'hidden',
                                      textOverflow: 'ellipsis',
                                      display: 'flex',
                                      alignItems: 'center',
                                    }}
                                  >
                                    {product.name}
                                    <span
                                      style={{
                                        marginLeft: 5,
                                        color: isOutOfStock ? 'red' : 'rgb(150, 191, 71)', // Red for "OS", rgb(150, 191, 71) for "-<count>"
                                        fontSize: `${fontSize * 0.7}px`, // Already set, kept for consistency
                                        fontWeight: 'bold',
                                      }}
                                    >
                                      {isOutOfStock ? 'OS' : `-${availableStock}`}
                                    </span>
                                  </div>
                                  <div
                                    style={{
                                      position: 'absolute',
                                      bottom: 5,
                                      left: 5,
                                      right: 5,
                                      display: 'flex',
                                      justifyContent: 'space-between',
                                      alignItems: 'center',
                                    }}
                                  >
                                    <div
                                      style={{
                                        background: 'rgba(0, 0, 0, 0.6)',
                                        color: '#FFFFFF',
                                        fontSize: `${fontSize * 0.9}px`,
                                        fontWeight: 'bold',
                                        padding: '2px 5px',
                                        borderRadius: 4,
                                        cursor: 'pointer',
                                      }}
                                    >
                                      <Tooltip
                                        title={
                                          product.priceDetails?.[selectedUnitIndex]
                                            ? formatTooltip(product.priceDetails[selectedUnitIndex], product.productType)
                                            : 'No Details'
                                        }
                                      >
                                        {formatPriceDetails(product.priceDetails, selectedUnitIndex)}
                                      </Tooltip>
                                    </div>
                                    <div
                                      style={{
                                        width: '40%',
                                      }}
                                      onClick={stopPropagation}
                                    >
                                      <Select
                                        value={selectedUnitIndex}
                                        onChange={(value) => handleUnitChange(product._id, value)}
                                        size="small"
                                        style={{ width: '100%' }}
                                      >
                                        {product.priceDetails?.map((detail, index) => (
                                          <Option key={index} value={index}>
                                            {formatUnitLabel(detail, product.productType)}
                                          </Option>
                                        ))}
                                      </Select>
                                    </div>
                                    {count > 0 && (
                                      <div
                                        style={{
                                          background: 'rgba(0, 0, 0, 0.6)',
                                          color: '#FFFFFF',
                                          fontSize: `${fontSize * 0.9}px`,
                                          fontWeight: 'bold',
                                          padding: '2px 5px',
                                          borderRadius: 4,
                                        }}
                                      >
                                        {count}
                                      </div>
                                    )}
                                  </div>
                                </div>
                                {count > 0 && (
                                  <CheckCircleFilled
                                    style={{
                                      position: 'absolute',
                                      top: -12,
                                      right: -12,
                                      fontSize: '24px',
                                      color: '#95BF47',
                                    }}
                                  />
                                )}
                              </div>
                            </Col>
                          );
                        })}
                      </Row>
                    ) : (
                      <div>No products found for this category.</div>
                    )}
                  </>
                ) : (
                  <>
                    <h2 style={{ color: '#000000', marginBottom: '15px' }}>{activeTab.charAt(0).toUpperCase() + activeTab.slice(1).replace(/([A-Z])/g, ' $1')}</h2>
                    <Row gutter={[16, 24]} justify="center">
                      {loading ? (
                        <div>Loading categories...</div>
                      ) : categories.length > 0 ? (
                        categories.map(category => (
                          <Col
                            key={category._id}
                            span={24 / columns}
                            style={{ display: 'flex', justifyContent: 'center' }}
                          >
                            <div
                              style={{
                                width: cardSize,
                                height: cardSize,
                                borderRadius: 8,
                                overflow: 'hidden',
                                display: 'flex',
                                flexDirection: 'column',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
                                cursor: 'pointer',
                              }}
                              onClick={() => handleCategoryClick(category)}
                            >
                              <div style={{ width: '100%', height: '100%', overflow: 'hidden', padding: 0, margin: 0 }}>
                                {category.image ? (
                                  <Image
                                    src={`${BACKEND_URL}/${category.image}`}
                                    alt={category.name}
                                    style={{ width: '100%', height: '100%', objectFit: 'cover', padding: 0, margin: 0 }}
                                    preview={false}
                                  />
                                ) : (
                                  <div style={{ width: '100%', height: '100%', background: '#E9E9E9', display: 'flex', justifyContent: 'center', alignItems: 'center', padding: 0, margin: 0 }}>No Image</div>
                                )}
                              </div>
                              <div style={{ width: '100%', background: '#000000', textAlign: 'center', padding: 0, margin: 0 }}>
                                <span
                                  style={{
                                    color: '#FFFFFF',
                                    fontSize: `${fontSize}px`,
                                    fontWeight: 'bold',
                                    padding: 0,
                                    margin: 0,
                                    display: 'block',
                                    lineHeight: `${lineHeight}px`,
                                    whiteSpace: 'nowrap',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                  }}
                                >
                                  {category.name}
                                </span>
                              </div>
                            </div>
                          </Col>
                        ))
                      ) : (
                        <div>No categories found</div>
                      )}
                    </Row>
                  </>
                )}
              </>
            )}
          </div>
        </Content>
        <Sider
          collapsed={!isCartExpanded}
          width={400}
          trigger={null}
          style={{
            background: '#FFFFFF',
            boxShadow: '-2px 0 4px rgba(0, 0, 0, 0.1)',
            display: isCartExpanded ? 'block' : 'none',
          }}
        >
          <div style={{ padding: '20px', color: '#000000', textAlign: 'left' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
              <h3 style={{ margin: 0 }}>Cart</h3>
              {activeTab === 'stock' && (
                <DatePicker
                  showTime
                  format="YYYY-MM-DD HH:mm"
                  placeholder="Select delivery date & time"
                  value={deliveryDateTime}
                  onChange={(date) => setDeliveryDateTime(date)}
                  style={{ width: '200px' }}
                  disabledDate={(current) => current && current < dayjs().startOf('day')}
                />
              )}
            </div>
            {lastBillNo && (
              <p style={{ marginBottom: '15px', fontWeight: 'bold' }}>
                Last Bill No: {lastBillNo}
              </p>
            )}
            {selectedTable && (
              <p style={{ marginBottom: '15px', fontWeight: 'bold' }}>
                Table: {selectedTable.tableNumber}
              </p>
            )}
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px' }}>Enter Waiter ID:</label>
              <Input
                value={waiterInput}
                onChange={(e) => handleWaiterInputChange(e.target.value)}
                placeholder="Enter waiter ID (e.g., 4 for E004)"
                style={{ width: '100%' }}
              />
              {waiterName && (
                <p style={{ marginTop: '5px', color: '#52c41a' }}>
                  Waiter: {waiterName}
                </p>
              )}
              {waiterError && (
                <p style={{ marginTop: '5px', color: '#ff4d4f' }}>
                  {waiterError}
                </p>
              )}
            </div>

            {currentTabSelections.length > 0 ? (
              <>
                <ul style={{ listStyleType: 'none', padding: 0 }}>
                  {currentTabSelections.map(product => (
                    <li key={`${product._id}-${product.selectedUnitIndex}`} style={{ marginBottom: '30px', fontSize: '14px', display: 'flex', flexDirection: 'column' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ flex: 1 }}>{formatDisplayName(product)}</span>
                        <span style={{ flex: 1, textAlign: 'right' }}>{formatPriceDetails(product.priceDetails, product.selectedUnitIndex)} x {product.count}</span>
                        <Button
                          type="text"
                          icon={<CloseOutlined />}
                          onClick={() => handleRemoveProduct(product._id, product.selectedUnitIndex)}
                          style={{ color: '#ff4d4f', fontSize: '14px', marginLeft: '10px' }}
                        />
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px', paddingBottom: '5px', borderBottom: '1px dotted #d9d9d9' }}>
                        <Space size="middle">
                          <Button
                            type="default"
                            icon={<MinusOutlined />}
                            onClick={() => handleDecreaseCount(product._id, product.selectedUnitIndex)}
                            size="small"
                            style={{ backgroundColor: '#ff4d4f', color: '#ffffff' }}
                          />
                          <span>{product.count}</span>
                          <Button
                            type="default"
                            icon={<PlusOutlined />}
                            onClick={() => handleIncreaseCount(product._id, product.selectedUnitIndex)}
                            size="small"
                            style={{ backgroundColor: '#95BF47', color: '#ffffff' }}
                          />
                        </Space>
                        {activeTab === 'stock' && (
                          <InputNumber
                            min={0}
                            value={product.bminstock || 0}
                            onChange={(value) => handleBMInStockChange(product._id, product.selectedUnitIndex, value)}
                            size="small"
                            style={{ width: '80px', margin: '0 10px' }}
                            placeholder="BM In-Stock"
                          />
                        )}
                        <span style={{ fontWeight: 'bold' }}>₹{calculateProductTotal(product)}</span>
                      </div>
                    </li>
                  ))}
                </ul>
                <div style={{ marginTop: '20px', borderTop: '1px solid #d9d9d9', paddingTop: '10px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '14px', marginBottom: '5px' }}>
                    <span>Total (Excl. GST)</span>
                    <span>₹{subtotal.toFixed(2)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '14px', marginBottom: '5px' }}>
                    <span>GST</span>
                    <span>₹{totalGST.toFixed(2)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '16px', fontWeight: 'bold' }}>
                    <span>Total (Incl. GST)</span>
                    <span>₹{totalWithGST.toFixed(2)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '14px', marginTop: '5px' }}>
                    <span>Total Items</span>
                    <span>{uniqueItems}</span>
                  </div>
                </div>
                <div style={{ marginTop: '15px', marginBottom: '15px' }}>
                  <Radio.Group
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    value={paymentMethod}
                    style={{ width: '100%', display: 'flex', justifyContent: 'space-between' }}
                  >
                    <Radio.Button value="cash" style={{ borderRadius: '50px', textAlign: 'center' }}>
                      <WalletOutlined /> Cash
                    </Radio.Button>
                    <Radio.Button value="upi" style={{ borderRadius: '50px', textAlign: 'center' }}>
                      <CreditCardOutlined /> UPI
                    </Radio.Button>
                    {(activeTab === 'stock' || activeTab === 'liveOrder') && (
                      <Radio.Button value="advance" style={{ borderRadius: '50px', textAlign: 'center' }}>
                        <FileDoneOutlined /> Advance
                      </Radio.Button>
                    )}
                  </Radio.Group>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '15px' }}>
                  <Button
                    type="primary"
                    icon={<SaveOutlined />}
                    onClick={handleSave}
                    style={{ flex: 1, marginRight: '10px' }}
                    disabled={lastBillNo && currentTabSelections.length === 0}
                  >
                    Save
                  </Button>
                  <Button
                    type="primary"
                    icon={<PrinterOutlined />}
                    onClick={handleSaveAndPrint}
                    style={{ flex: 1 }}
                    disabled={lastBillNo && currentTabSelections.length === 0}
                  >
                    Save & Print
                  </Button>
                </div>
              </>
            ) : (
              <p>No products selected.</p>
            )}
          </div>
        </Sider>
      </Layout>
    </Layout>
  );
};

export async function getServerSideProps(context) {
  const { params } = context;
  const { branchId } = params;

  return {
    props: {
      branchId,
    },
  };
}

BranchPage.useLayout = false;
export default BranchPage;